const redisClientPool = require('../redis/redis-server');
const dockerClientPool = require('../docker/docker_connection');
const { setUpSocketServer, getIo } = require('../socketServer/socket');
const Bull = require("bull");
const { Exec } = require('dockerode');
const { exec, spawn } = require('child_process');
const pty = require('node-pty');
const util = require('util');
const { fstat } = require('fs');
const fs = require('fs');

const generateRandomUsername = () => {
    const randomNum = Math.floor(100 + Math.random() * 900);
    return `user${randomNum}`;
};

const  setupKubernetesNamespace= async () => {
    const io = getIo();
    const userNamespace = io.of('/kubernetes');
    console.log("Initializing kubernetes Namespace");

    userNamespace.on('connection', async (socket) => {
        console.log("User connected:", socket.id);

        const redisClient = await redisClientPool.borrowClient();
        const uniqueUser = generateRandomUsername();

        // Create a new user with a home directory
        //const userAdd = spawn('sudo', ['useradd', '-m', uniqueUser]);
        const userAdd = spawn('sudo', ['useradd', '-m', '-d', `/home/${uniqueUser}`, '-s', '/bin/bash', uniqueUser]);


        userAdd.on('close', async (code) => {
            if (code !== 0) {
                console.error(`Error creating user ${uniqueUser}`);
                socket.disconnect();
                return;
            }

            console.log(`Created user: ${uniqueUser}`);
            
            const setupKubeConfig = spawn('sudo', [
                'bash', '-c', `
                    mkdir -p /home/${uniqueUser}/.kube &&
                    cp /home/ahmad/.kube/config /home/${uniqueUser}/.kube/ &&
                    cp -r /home/ahmad/.minikube /home/${uniqueUser}/ &&
                    chown -R ${uniqueUser}:${uniqueUser} /home/${uniqueUser}/.kube &&
                    chown -R ${uniqueUser}:${uniqueUser} /home/${uniqueUser}/.minikube
                    sed -i "s|/home/ahmad/.minikube|/home/${uniqueUser}/.minikube|g" /home/${uniqueUser}/.kube/config
                `
            ]);
            
            setupKubeConfig.on('close', (code) => {
                if (code !== 0) {
                    console.error(`Failed to setup kubeconfig for ${uniqueUser}`);
                    return;
                }
            
                console.log(`Kubeconfig setup completed for ${uniqueUser}`);
            
                // **2. Run commands as the new user**
                const setupUserEnv = spawn('sudo', ['-u', uniqueUser, 'bash', '-c', `
                    echo 'export MINIKUBE_HOME=/home/${uniqueUser}/.minikube' >> ~/.bashrc &&
                    echo 'export KUBECONFIG=/home/${uniqueUser}/.kube/config' >> ~/.bashrc &&
                    source ~/.bashrc &&
                    chmod -R u+r ~/.minikube &&
                    chmod 600 ~/.minikube/profiles/minikube/client.key
                `]);
            
                setupUserEnv.on('close', (envCode) => {
                    if (envCode !== 0) {
                        console.error(`Failed to set environment variables for ${uniqueUser}`);
                        return;
                    }
                    console.log(`Environment setup completed for ${uniqueUser}`);

                    const setupNamespace = spawn("kubectl", ["create", "namespace", `namespace-${uniqueUser}`])

                    setupNamespace.on("close", (code) => {
                        if (code !== 0) {
                            console.error(`Failed to create namespace for ${uniqueUser}`)
                            return
                        }
                        console.log(`Namespace created for: ${uniqueUser}`) 

                        // Create a ClusterRole to deny access to other namespaces
                        const clusterRoleYAML = `
                          kind: ClusterRole
                          apiVersion: rbac.authorization.k8s.io/v1
                          metadata:
                            name: restricted-${uniqueUser}
                          rules:
                            - apiGroups: [""]
                              resources: ["namespaces"]
                              verbs: ["get"]
                              resourceNames: ["namespace-${uniqueUser}"]
        
                        `;
                        fs.writeFileSync(`/tmp/clusterrole-${uniqueUser}.yaml`, clusterRoleYAML)

                        const applyClusterRole = spawn("kubectl", ["apply", "-f", `/tmp/clusterrole-${uniqueUser}.yaml`])
                        applyClusterRole.on("close", (code) => {
                            if (code !== 0) {
                              console.error(`Failed to create cluster role for ${uniqueUser}`)
                              return
                            }
                            console.log(`Cluster role created for: ${uniqueUser}`) 
                            const clusterRoleBindingYAML = `
                             kind: ClusterRoleBinding
                             apiVersion: rbac.authorization.k8s.io/v1
                             metadata:
                               name: restricted-binding-${uniqueUser}
                             subjects:
                               - kind: User
                                 name: ${uniqueUser}
                                 apiGroup: rbac.authorization.k8s.io
                             roleRef:
                               kind: ClusterRole
                               name: restricted-${uniqueUser}
                               apiGroup: rbac.authorization.k8s.io
                            `;
                            fs.writeFileSync(`/tmp/clusterrolebinding-${uniqueUser}.yaml`, clusterRoleBindingYAML)

                            const applyClusterRoleBinding = spawn("kubectl", [ "apply", "-f", `/tmp/clusterrolebinding-${uniqueUser}.yaml`, ])
                            applyClusterRoleBinding.on("close", (code) => {
                                if (code !== 0) {
                                  console.error(`Failed to create cluster role binding for ${uniqueUser}`)
                                  return
                                }
                                console.log(`Cluster role binding created for: ${uniqueUser}`)
                                // Create a namespace-scoped Role with more specific permissions
                                const roleYAML = `
                                  kind: Role
                                  apiVersion: rbac.authorization.k8s.io/v1
                                  metadata:
                                     namespace: namespace-${uniqueUser}
                                     name: user-role-${uniqueUser}
                                  rules:
                                    - apiGroups: [""]
                                      resources: ["pods", "services", "configmaps"]
                                      verbs: ["get", "list", "watch", "create", "update", "delete"]
                                    - apiGroups: ["apps"]
                                      resources: ["deployments"]
                                      verbs: ["get", "list", "watch", "create", "update", "delete"]
                                `;
                                fs.writeFileSync(`/tmp/role-${uniqueUser}.yaml`, roleYAML)

                                const applyRole = spawn("kubectl", ["apply", "-f", `/tmp/role-${uniqueUser}.yaml`])
                                applyRole.on("close", (code) => {
                                    if (code !== 0) {
                                      console.error(`Failed to create role for ${uniqueUser}`)
                                      return
                                    }
                                    console.log(`Role created for: ${uniqueUser}`) 
                                    // Bind role to specific user
                                    const roleBindingYAML = `
                                     kind: RoleBinding
                                     apiVersion: rbac.authorization.k8s.io/v1
                                     metadata:
                                        namespace: namespace-${uniqueUser}
                                        name: user-rolebinding-${uniqueUser}
                                     subjects:
                                       - kind: User
                                         name: ${uniqueUser}
                                         apiGroup: rbac.authorization.k8s.io
                                     roleRef:
                                       kind: Role
                                       name: user-role-${uniqueUser}
                                       apiGroup: rbac.authorization.k8s.io
                                    `;
                                    fs.writeFileSync(`/tmp/rolebinding-${uniqueUser}.yaml`, roleBindingYAML)

                                    const applyRoleBinding = spawn("kubectl", ["apply", "-f", `/tmp/rolebinding-${uniqueUser}.yaml`])
                                    applyRoleBinding.on("close", (code) => {
                                        if (code !== 0) {
                                          console.error(`Failed to bind role for ${uniqueUser}`)
                                          return
                                        }
                                        console.log(`Role bound for: ${uniqueUser}`) 
                                        // Create a context for the user
                                        const createContext = spawn("kubectl", [ "config","set-context",`context-${uniqueUser}`,"--cluster=minikube", `--user=${uniqueUser}`, `--namespace=namespace-${uniqueUser}`, ])
                                        createContext.on("close", (code) => {
                                            if (code !== 0) {
                                              console.error(`Failed to create context for ${uniqueUser}`)
                                              return
                                            }
                                            console.log(`Context created for: ${uniqueUser}`)

                                            const customKubeconfig = spawn("sudo", [
                                                "bash",
                                                "-c",
                                                `
                                                kubectl config view --flatten --minify --context=context-${uniqueUser} > /home/${uniqueUser}/.kube/restricted-config &&
                                                chown ${uniqueUser}:${uniqueUser} /home/${uniqueUser}/.kube/restricted-config &&
                                                chmod 600 /home/${uniqueUser}/.kube/restricted-config
                                                `,
                                            ])
                                            customKubeconfig.on("close", (code) => {
                                                if (code !== 0) {
                                                  console.error(`Failed to create custom kubeconfig for ${uniqueUser}`)
                                                  return
                                                }
                                                console.log(`Custom kubeconfig created for: ${uniqueUser}`)
                                            });
                                        });    
                                    });
                                });
                            });
                        });
                    });
                });
            });


/////////////////////////////////////////////////////////            
            await redisClient.set(socket.id, uniqueUser);

            // Spawn a new shell session for the user
            const userShell = pty.spawn('/bin/bash', [], {
                name: 'xterm-color',
                cols: 80,
                rows: 24,
                env: {
                    ...process.env,
                    HOME: `/home/${uniqueUser}`, 
                    USER: uniqueUser
                }
            });

            let isUserSwitched = false;
            let bufferedOutput = '';

            userShell.on('data', (data) => {
                if (!isUserSwitched) {
                    bufferedOutput += data;
                    if (bufferedOutput.includes(uniqueUser)) {
                        isUserSwitched = true;
                        socket.emit('output', bufferedOutput);
                        bufferedOutput = '';
                    }
                } else {
                    socket.emit('output', data);
                }
            });

            // Ensure the user is in their home directory
            //userShell.write(`cd /home/${uniqueUser} && clear\n`);
            userShell.write(`sudo -u ${uniqueUser} -i\n`);
            userShell.write(`cd /home/${uniqueUser} && clear\n`);

            // Handle incoming commands
            socket.on('command', (command) => {
                userShell.write(command);
            });

            // Handle user disconnection
            socket.on('disconnect', async () => {
                console.log(`User disconnected: ${socket.id}`);
                userShell.kill();

                const storedUser = await redisClient.get(socket.id);
                if (storedUser) {
                    console.log(`Removing user: ${storedUser}`);
                    //const userDel = spawn('sudo', ['userdel', '-r', storedUser]);
                    const deleteK8sResources = spawn("sudo", [
                        "bash",
                        "-c",
                        `
                        kubectl delete clusterrolebinding restricted-binding-${storedUser} || true &&
                        kubectl delete clusterrole restricted-${storedUser} || true &&
                        kubectl delete rolebinding user-rolebinding-${storedUser} -n namespace-${storedUser} || true &&
                        kubectl delete role user-role-${storedUser} -n namespace-${storedUser} || true &&
                        kubectl delete namespace namespace-${storedUser} || true &&
                        kubectl config delete-context context-${storedUser} || true
                        `,
                    ])
                    const deleteTempFiles = spawn("sudo", [
                        "bash",
                        "-c",
                        `
                         rm -f /tmp/role-${storedUser}.yaml /tmp/rolebinding-${storedUser}.yaml /tmp/clusterrole-${storedUser}.yaml /tmp/clusterrolebinding-${storedUser}.yaml || true
                                                    `,
                    ])
                    const userDel = spawn('sudo', [
                        'bash', '-c', `
                            pkill -9 -u ${storedUser} || true &&
                            userdel -r ${storedUser} || true
                        `
                    ]);
                    

                    userDel.on('close', async (delCode) => {
                        if (delCode !== 0) {
                            console.error(`Error deleting user ${storedUser}`);
                        }
                        await redisClient.del(socket.id);
                    });
                }
            });
        });
    });
};








module.exports = setupKubernetesNamespace;
