import axios from 'axios';
import { useAuthContext } from "../API/UseAuthContext";
import { useNavigate } from "react-router-dom";

const api = axios.create({
  baseURL: process.env.REACT_APP_BASE_URL,
  withCredentials: true, 
});

export const LogoutUser = () => {
    const {dispatch} = useAuthContext();
    const navigate = useNavigate();

  const logout = async () => {
    try {
      const response = await api.post('/user/logout'); 
      if (response.status >= 200 && response.status < 300) {
        dispatch({type: 'LOGOUT'})
        navigate("/login");
      } else {
        console.error("Logout Failed", response.data);
      }
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  return { logout };
};
