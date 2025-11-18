import { useState } from "react";
import { Button, Label, TextInput, Alert } from "flowbite-react";
import { useNavigate } from "react-router";
import { supabase } from "../../../utils/supabaseClient";
import { useUser } from "../../../contexts/UserContext";

const AuthLogin = () => {
  const navigate = useNavigate();
  const { setIsLoggingIn } = useUser();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    setIsLoggingIn(true);

    try {
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      if (signInError) {
        if (signInError.message === "Invalid login credentials") {
          throw new Error("El correo electrónico o la contraseña son incorrectos.");
        } else if (signInError.message.includes("Email not confirmed")) {
          throw new Error("Por favor, verifica tu correo electrónico antes de iniciar sesión.");
        }
        throw signInError;
      }

      if (authData.user) {
        const { data: profileData, error: profileError } = await supabase
            .from('perfiles')
            .select('is_active')
            .eq('id', authData.user.id)
            .single();

        if (profileError) throw new Error("No se pudo verificar el estado de la cuenta.");

        if (profileData && !profileData.is_active) {
            await supabase.auth.signOut();
            throw new Error("Esta cuenta ha sido desactivada.");
        }
      }
      
      navigate("/");

    } catch (err: any) {
      setError(err.message || "Ocurrió un error al iniciar sesión.");
    } finally {
      setLoading(false);
      setIsLoggingIn(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        {error && <Alert color="failure" className="mb-4">{error}</Alert>}

        <div className="mb-4">
          <Label htmlFor="email" value="Correo Electrónico" />
          <TextInput
            id="email"
            name="email"
            type="email"
            sizing="md"
            required
            onChange={handleChange}
            value={formData.email}
          />
        </div>
        <div className="mb-6">
          <Label htmlFor="password" value="Contraseña" />
          <TextInput
            id="password"
            name="password"
            type="password"
            sizing="md"
            required
            onChange={handleChange}
            value={formData.password}
          />
        </div>
        
        <Button type="submit" color="primary" className="w-full" disabled={loading}>
          {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
        </Button>
      </form>
    </>
  );
};

export default AuthLogin;