import { useState } from "react";
import { Button, Label, TextInput, Alert } from "flowbite-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../utils/supabaseClient";

const validarCedulaEcuador = (identificacion: string): boolean => {
  if (typeof identificacion !== 'string' || identificacion.length !== 10 || !/^\d+$/.test(identificacion)) {
    return false;
  }
  const digitos = identificacion.split('').map(Number);
  const provincia = parseInt(identificacion.substring(0, 2), 10);
  if (provincia < 1 || provincia > 24) {
    return false;
  }
  const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let suma = 0;
  for (let i = 0; i < 9; i++) {
    let valor = digitos[i] * coeficientes[i];
    if (valor >= 10) {
      valor -= 9;
    }
    suma += valor;
  }
  const digitoVerificadorCalculado = (suma % 10 === 0) ? 0 : 10 - (suma % 10);
  return digitoVerificadorCalculado === digitos[9];
};

const AuthRegister = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    nombre1: "",
    nombre2: "",
    apellido1: "",
    apellido2: "",
    cedula: "",
    telefono: "",
    fecha_nacimiento: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;

    if (name === 'telefono') {
      const re = /^[0-9\b]+$/;
      if (value === '' || re.test(value)) {
        setFormData((prev) => ({ ...prev, [name]: value }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const emailNormalizado = formData.email.trim().toLowerCase();
    const identificacionLimpia = formData.cedula.trim();
    const telefonoLimpio = formData.telefono.trim();
    const nombre1Limpio = formData.nombre1.trim();
    const apellido1Limpio = formData.apellido1.trim();

    const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;

    if (nombre1Limpio.length === 0 || !nameRegex.test(nombre1Limpio)) {
        setError("El primer nombre es obligatorio y solo puede contener letras.");
        return;
    }
    if (apellido1Limpio.length === 0 || !nameRegex.test(apellido1Limpio)) {
        setError("El primer apellido es obligatorio y solo puede contener letras.");
        return;
    }
    if (identificacionLimpia.length === 0) {
        setError("El campo Identificación es obligatorio.");
        return;
    }

    const esNumerico = /^\d+$/.test(identificacionLimpia);
    if (identificacionLimpia.length === 10 && esNumerico) {
        if (!validarCedulaEcuador(identificacionLimpia)) {
            setError("La Cédula de 10 dígitos ingresada no es válida.");
            return;
        }
    } else if (identificacionLimpia.length < 5) {
        setError("La identificación (Pasaporte/Cédula extranjera) debe tener al menos 5 caracteres.");
        return;
    }

    if (telefonoLimpio.length !== 10) {
      setError("El número de teléfono debe tener 10 dígitos.");
      return;
    }
    if (formData.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    const fechaNacimiento = new Date(formData.fecha_nacimiento);
    const hoy = new Date();
    const edadMinima = new Date(hoy.getFullYear() - 10, hoy.getMonth(), hoy.getDate());
    const edadMaxima = new Date(hoy.getFullYear() - 75, hoy.getMonth(), hoy.getDate());

    if (fechaNacimiento.toString() === "Invalid Date" || fechaNacimiento > hoy) {
        setError("La fecha de nacimiento no es válida o es en el futuro.");
        return;
    }
    if (fechaNacimiento > edadMinima) {
      setError("Debes ser mayor de 10 años para registrarte.");
      return;
    }
    if (fechaNacimiento < edadMaxima) {
      setError("La edad máxima permitida es de 75 años.");
      return;
    }

    setLoading(true);
    
    try {
      const { data: cedulaExistente, error: cedulaError } = await supabase
        .from('perfiles')
        .select('cedula')
        .eq('cedula', identificacionLimpia);

      if (cedulaError) throw cedulaError;

      if (cedulaExistente && cedulaExistente.length > 0) {
        throw new Error("La identificación ingresada ya se encuentra registrada.");
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: emailNormalizado,
        password: formData.password,
      });

      if (authError) {
        if (authError.message.includes("User already registered")) {
            throw new Error("El correo electrónico ya se encuentra registrado.");
        }
        throw authError;
      }
      if (!authData.user) throw new Error("No se pudo crear el usuario.");

      const { error: profileError } = await supabase
        .from("perfiles")
        .insert({
          id: authData.user.id,
          nombre1: nombre1Limpio,
          nombre2: formData.nombre2.trim() || null,
          apellido1: apellido1Limpio,
          apellido2: formData.apellido2.trim() || null,
          cedula: identificacionLimpia,
          telefono: telefonoLimpio,
          fecha_nacimiento: formData.fecha_nacimiento,
          email: emailNormalizado,
        });
      
      if (profileError) throw profileError;
      
      setSuccessMessage("¡Registro exitoso! Revisa tu correo para verificar tu cuenta. Serás redirigido en 5 segundos...");
      setTimeout(() => {
        navigate("/auth/login");
      }, 5000);

    } catch (err: any) {
      setError(err.message || "Ocurrió un error durante el registro.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        {error && <Alert color="failure" className="mb-4">{error}</Alert>}
        {successMessage && <Alert color="success" className="mb-4">{successMessage}</Alert>}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <Label htmlFor="nombre1" value="Primer Nombre" />
            <TextInput id="nombre1" name="nombre1" type="text" required onChange={handleChange} value={formData.nombre1} maxLength={50} />
          </div>
          <div>
            <Label htmlFor="nombre2" value="Segundo Nombre (Opcional)" />
            <TextInput id="nombre2" name="nombre2" type="text" onChange={handleChange} value={formData.nombre2} maxLength={50} />
          </div>
          <div>
            <Label htmlFor="apellido1" value="Primer Apellido" />
            <TextInput id="apellido1" name="apellido1" type="text" required onChange={handleChange} value={formData.apellido1} maxLength={50} />
          </div>
          <div>
            <Label htmlFor="apellido2" value="Segundo Apellido (Opcional)" />
            <TextInput id="apellido2" name="apellido2" type="text" onChange={handleChange} value={formData.apellido2} maxLength={50} />
          </div>
          <div>
            <Label htmlFor="cedula" value="Identificación (Cédula / Pasaporte)" />
            <TextInput id="cedula" name="cedula" type="text" maxLength={20} required onChange={handleChange} value={formData.cedula} />
          </div>
          <div>
            <Label htmlFor="telefono" value="Teléfono (10 dígitos)" />
            <TextInput id="telefono" name="telefono" type="tel" inputMode="numeric" pattern="\d*" maxLength={10} required onChange={handleChange} value={formData.telefono} />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="fecha_nacimiento" value="Fecha de Nacimiento" />
            <TextInput id="fecha_nacimiento" name="fecha_nacimiento" type="date" required onChange={handleChange} value={formData.fecha_nacimiento} />
          </div>
        </div>

        <div className="mb-4">
          <Label htmlFor="email" value="Correo Electrónico" />
          <TextInput id="email" name="email" type="email" required onChange={handleChange} value={formData.email} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <Label htmlFor="password" value="Contraseña" />
            <TextInput id="password" name="password" type="password" required onChange={handleChange} value={formData.password} minLength={6} />
            <p className="mt-1 text-sm text-gray-500">Mínimo 6 caracteres.</p>
          </div>
          <div>
            <Label htmlFor="confirmPassword" value="Confirmar Contraseña" />
            <TextInput id="confirmPassword" name="confirmPassword" type="password" required onChange={handleChange} value={formData.confirmPassword} minLength={6} />
          </div>
        </div>

        <Button color="primary" type="submit" className="w-full" disabled={loading || !!successMessage}>
          {loading ? "Registrando..." : "Registrarse"}
        </Button>
      </form>
    </>
  );
};

export default AuthRegister;