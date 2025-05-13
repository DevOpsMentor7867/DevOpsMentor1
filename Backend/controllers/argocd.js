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

const setupArgoCDNamespace = async () => {
    const io = getIo();
    const userNamespace = io.of('/argocd');
    console.log("Initializing argocd Namespace");

    userNamespace.on('connection', async (socket) => {
        console.log("User connected:", socket.id);

        const redisClient = await redisClientPool.borrowClient();

        const uniqueUser = generateRandomUsername();
        await redisClient.set(socket.id, uniqueUser);

        // Create a new user with a home directory

        const userAdd = spawn('sudo', ['bash', '-c', `
        useradd -m -d /home/${uniqueUser} -s /bin/bash ${uniqueUser} &&
        passwd -d ${uniqueUser}
    `]);


        userAdd.on('close', async (code) => {
            if (code !== 0) {
                console.error(`Error creating user ${uniqueUser}`);
                socket.disconnect();
                return;
            }

            console.log(`Created user: ${uniqueUser}`);

            const setupKubeConfig = spawn('sudo', ['bash','-c', `
                sudo mkdir -p /home/${uniqueUser}/.kube &&
                sudo chown -R ${uniqueUser}:${uniqueUser} /home/${uniqueUser}/.kube &&
                sudo chmod 700 /home/${uniqueUser}/.kube  &&
                mkdir -p /home/${uniqueUser}/.config/gcloud &&
                cp -r /home/ahmad/.config/gcloud/* /home/${uniqueUser}/.config/gcloud/ && 
                chown -R ${uniqueUser}:${uniqueUser} /home/${uniqueUser}/.config/gcloud

            `
            ]);
            setupKubeConfig.stdout.on('data', (data) => {
                console.log(`kubeconfig stdout: ${data}`);
            });

            setupKubeConfig.stderr.on('data', (data) => {
                console.error(`kubeconfig stderr: ${data}`);
            });
            setupKubeConfig.on('close', (code) => {
                if (code !== 0) {
                    console.error(`Failed to setup kubeconfig for ${uniqueUser}`);
                    return;
                }

                console.log(`Kubeconfig setup completed for ${uniqueUser}`);

                const setupGCloud = spawn('su', ['-c',
                    `gcloud container clusters get-credentials cluster-1 --zone asia-south1-c --project delta-carving-450413-j3`,
                    uniqueUser
                ]);

                setupGCloud.stdout.on('data', (data) => {
                    console.log(`setupGCloud stdout: ${data}`);
                });

                setupGCloud.stderr.on('data', (data) => {
                    console.error(`setupGCloud stderr: ${data}`);
                });

                setupGCloud.on('close', (code) => {
                    if (code !== 0) {
                        console.error(`Failed to setup gcloud credentials for ${uniqueUser}`);
                        return;
                    }

                    console.log(`GCloud credentials setup completed for ${uniqueUser}`);

                    // creating namespace
                    const setupNamespace = spawn("kubectl", ["create", "namespace", `argocd-${uniqueUser}`])

                    setupNamespace.on("close", (code) => {
                        if (code !== 0) {
                            console.error(`Failed to create namespace for ${uniqueUser}`)
                            return
                        }
                        console.log(`Namespace created for: ${uniqueUser}`)
                        const valuesYaml = `
                         crds:
                           install: false
                           keep: false
                         global:
                           additionalLabels:
                            app: argocd-${uniqueUser}
                        `;

                        const valuesFilePath = `/tmp/argocd-values-${uniqueUser}.yaml`;
                        fs.writeFileSync(valuesFilePath, valuesYaml);
                        const installArgoCD = spawn("helm", [
                            "install",
                            `argocd-${uniqueUser}`, 
                            "argo/argo-cd",         
                            "--namespace",
                            `argocd-${uniqueUser}`,
                            "-f",
                            valuesFilePath
                        ]);
                        installArgoCD.stdout.on('data', (data) => {
                            console.log(`installArgoCD stdout: ${data}`);
                        });
        
                        installArgoCD.stderr.on('data', (data) => {
                            console.error(`installArgoCD stderr: ${data}`);
                        });
                        installArgoCD.on("close", (code) => {
                            if (code !== 0) {
                                console.error(`Failed to install ArgoCD for ${uniqueUser}`);
                                return;
                            }
                            console.log(`ArgoCD installed for: ${uniqueUser}`);

                            const patchConfigMap = spawn("kubectl", [
                                "patch",
                                "configmap",
                                "argocd-cmd-params-cm",
                                "-n",
                                `argocd-${uniqueUser}`,
                                "--type",
                                "merge",
                                "-p",
                                '{"data":{"server.insecure": "true"}}',
                            ]);

                            patchConfigMap.on("close", (code) => {
                                if (code !== 0) {
                                    console.error(`Failed to patch ConfigMap for ${uniqueUser}`);
                                    return;
                                }
                                console.log(`ConfigMap patched for: ${uniqueUser}`); 

                                const restartArgoCD = spawn("kubectl", [
                                    "rollout",
                                    "restart",
                                    `deployment/argocd-${uniqueUser}-server`,
                                    "-n",
                                    `argocd-${uniqueUser}`,
                                ]);
                                restartArgoCD.stdout.on('data', (data) => {
                                    console.log(`restartArgoCD stdout: ${data}`);
                                });
                
                                restartArgoCD.stderr.on('data', (data) => {
                                    console.error(`restartArgoCD stderr: ${data}`);
                                });

                                restartArgoCD.on("close", (code) => {
                                    if (code !== 0) {
                                        console.error(`Failed to restart ArgoCD server for ${uniqueUser}`);
                                        return;
                                    }
                                    console.log(`ArgoCD server restarted for: ${uniqueUser}`); 
                                    
                                    const ingressYaml = `
                                    apiVersion: networking.k8s.io/v1
                                    kind: Ingress
                                    metadata:
                                      name: argocd-server-http-ingress-${uniqueUser}
                                      namespace: argocd-${uniqueUser}
                                      annotations:
                                         nginx.ingress.kubernetes.io/backend-protocol: "HTTP"
                                         
                                    spec:
                                      ingressClassName: nginx
                                      rules:
                                      - http:
                                          paths:
                                          - path: /${uniqueUser}
                                            pathType: Prefix
                                            backend:
                                              service:
                                                name: argocd-${uniqueUser}-server
                                                port:
                                                  name: http
                                    `;
                                    const ingressFilePath = `/tmp/argocd-ingress-${uniqueUser}.yaml`;
                                    fs.writeFileSync(ingressFilePath, ingressYaml);
                                    const applyIngress = spawn("kubectl", ["apply", "-f", ingressFilePath]);
                                    applyIngress.stdout.on('data', (data) => {
                                        console.log(`apply ingress stdout: ${data}`);
                                    });
                    
                                    applyIngress.stderr.on('data', (data) => {
                                        console.error(`apply ingress stderr: ${data}`);
                                    });
    
                                    applyIngress.on("close", (code) => {
                                        if (code !== 0) {
                                            console.error(`Failed to apply Ingress for ${uniqueUser}`);
                                            return;
                                        }
                                        console.log(`Ingress applied for: ${uniqueUser}`);

                                        //
                                        const patchConfigMap = spawn("kubectl", [
                                            "patch",
                                            "configmap",
                                            `argocd-cmd-params-cm`,
                                            "-n",
                                            `argocd-${uniqueUser}`,
                                            "--type",
                                            "merge",
                                            "-p",
                                            JSON.stringify({
                                                data: {
                                                    "server.rootpath": `/${uniqueUser}`,
                                                    "server.disable.auth": "true"
                                                    
                                                }
                                            })
                                        ]);
                                        
                                        patchConfigMap.stdout.on("data", (data) => {
                                            console.log(`patchConfigMap stdout: ${data}`);
                                        });
                                        
                                        patchConfigMap.stderr.on("data", (data) => {
                                            console.error(`patchConfigMap stderr: ${data}`);
                                        });

                                        patchConfigMap.on("close", (code) => {
                                            if (code !== 0) {
                                                console.error(`Failed to modify root path for ${uniqueUser}`);
                                                return;
                                            }
                                            console.log(`modified root path: ${uniqueUser}`); 

                                            const restartArgoCDServer = spawn("kubectl", [
                                                "rollout",
                                                "restart",
                                                `deployment/argocd-${uniqueUser}-server`,
                                                "-n",
                                                `argocd-${uniqueUser}`,
                                            ]);
                                            restartArgoCDServer.stdout.on('data', (data) => {
                                                console.log(`restartArgoCD stdout: ${data}`);
                                            });
                            
                                            restartArgoCDServer.stderr.on('data', (data) => {
                                                console.error(`restartArgoCD stderr: ${data}`);
                                            });
            
                                            restartArgoCDServer.on("close", (code) => {
                                                if (code !== 0) {
                                                    console.error(`Failed to restart ArgoCD server for ${uniqueUser}`);
                                                    return;
                                                }
                                                console.log(`ArgoCD server restarted for: ${uniqueUser}`);  
                                            });

                                        });


                                    });
                                
                                });
                            
                            });
                        });
                        
                        
                        
                    });
                });
            });

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
            
            let argoUrl = `http://34.100.203.84/${uniqueUser}`;
            socket.emit("argo_url", { url: argoUrl });
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
                    const deleteK8sResources = spawn("bash", [
                        "-c",
                        `
                        # Delete Helm release
                        helm uninstall argocd-${storedUser} -n argocd-${storedUser} || true
                    
                        # Delete Ingress
                        kubectl delete ingress argocd-server-http-ingress-${storedUser} -n argocd-${storedUser} --ignore-not-found=true
                    
                        # Delete Namespace (removes everything inside)
                        kubectl delete namespace argocd-${storedUser} --ignore-not-found=true
                        `,
                    ]);

                    deleteK8sResources.on("close", (code) => {
                        if (code !== 0) {
                            console.error(`Failed to delete K8s resources for ${storedUser}`);
                        } else {
                            console.log(`Successfully deleted all resources for: ${storedUser}`);
                        }
                    });

                    //const userDel = spawn('sudo', ['userdel', '-r', storedUser]);
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

module.exports = setupArgoCDNamespace;