import { useState } from "react";
import { Button, Label, TextInput, Alert, FileInput, Select } from "flowbite-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "src/utils/supabaseClient";

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
  const [idType, setIdType] = useState('cedula'); // 'cedula' or 'pasaporte'
  const [careerProofFile, setCareerProofFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null); // For general submission errors
  const [formErrors, setFormErrors] = useState({
    cedula: '',
    telefono: '',
    fecha_nacimiento: '',
  });
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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.type === "application/pdf") {
        setCareerProofFile(file);
      } else {
        setError("Por favor, sube solo archivos PDF.");
        event.target.value = ""; // Reset file input
      }
    }
  };

  const handleTelefonoBlur = () => {
    const telefonoLimpio = formData.telefono.trim();
    if (!/^09\d{8}$/.test(telefonoLimpio)) {
      setFormErrors(prev => ({ ...prev, telefono: 'El teléfono debe tener 10 dígitos y empezar con 09.' }));
    } else {
      setFormErrors(prev => ({ ...prev, telefono: '' }));
    }
  };

  const handleIdentificacionBlur = async () => {
    const identificacionLimpia = formData.cedula.trim();
    if (identificacionLimpia.length === 0) {
      setFormErrors(prev => ({ ...prev, cedula: 'Este campo es obligatorio.'}));
      return;
    }

    if (idType === 'cedula') {
      if (!/^\d{10}$/.test(identificacionLimpia)) {
        setFormErrors(prev => ({ ...prev, cedula: 'La cédula debe tener 10 dígitos numéricos.' }));
        return;
      }
      if (!validarCedulaEcuador(identificacionLimpia)) {
        setFormErrors(prev => ({ ...prev, cedula: 'La Cédula ingresada no es válida.' }));
        return;
      }
    } else { // Pasaporte
      const passportRegex = /^[a-zA-Z0-9]{5,20}$/;
      if (!passportRegex.test(identificacionLimpia)) {
        setFormErrors(prev => ({ ...prev, cedula: 'El pasaporte debe ser alfanumérico y tener entre 5 y 20 caracteres.' }));
        return;
      }
    }

    // Si el formato es válido, verificar unicidad
    try {
      const { data, error } = await supabase.from('perfiles').select('cedula').eq('cedula', identificacionLimpia);
      if (error) throw error;
      if (data && data.length > 0) {
        setFormErrors(prev => ({ ...prev, cedula: 'Esta identificación ya está registrada.' }));
      } else {
        setFormErrors(prev => ({ ...prev, cedula: '' }));
      }
    } catch (err) {
      // No alertar al usuario, solo loguear el error de la validación en background
      console.error("Error al validar identificación:", err);
    }
  };

  const handleFechaNacimientoBlur = () => {
    const fechaNacimientoStr = formData.fecha_nacimiento;
    if (!fechaNacimientoStr) {
      setFormErrors(prev => ({ ...prev, fecha_nacimiento: 'La fecha de nacimiento es obligatoria.' }));
      return;
    }

    const fechaNacimiento = new Date(fechaNacimientoStr);
    const hoy = new Date();
    const edadMinima = new Date(hoy.getFullYear() - 10, hoy.getMonth(), hoy.getDate());
    const edadMaxima = new Date(hoy.getFullYear() - 105, hoy.getMonth(), hoy.getDate());

    if (fechaNacimiento.toString() === "Invalid Date" || fechaNacimiento > hoy) {
        setFormErrors(prev => ({ ...prev, fecha_nacimiento: 'La fecha de nacimiento no es válida o es en el futuro.' }));
        return;
    }
    if (fechaNacimiento > edadMinima) {
      setFormErrors(prev => ({ ...prev, fecha_nacimiento: 'Debes ser mayor de 10 años para registrarte.' }));
      return;
    }
    if (fechaNacimiento < edadMaxima) {
      setFormErrors(prev => ({ ...prev, fecha_nacimiento: 'La edad máxima permitida es de 75 años.' }));
      return;
    }
    setFormErrors(prev => ({ ...prev, fecha_nacimiento: '' }));
  };
  
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // Re-run validations to catch cases where user didn't blur
    handleTelefonoBlur();
    await handleIdentificacionBlur();
    handleFechaNacimientoBlur();

    // Check if any errors exist after final validation
    if (formErrors.cedula || formErrors.telefono || formErrors.fecha_nacimiento) {
      setError("Por favor, corrige los errores marcados en el formulario.");
      return;
    }

    const emailNormalizado = formData.email.trim().toLowerCase();
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
    
    if (formData.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    // --- Fin de validaciones ---

    setLoading(true);

    const identificacionLimpia = formData.cedula.trim();
    const telefonoLimpio = formData.telefono.trim();
    
    try {
      // 1. Verificar si la cédula ya existe
      const { data: cedulaExistente, error: cedulaError } = await supabase
        .from('perfiles')
        .select('cedula')
        .eq('cedula', identificacionLimpia);

      if (cedulaError) throw cedulaError;
      if (cedulaExistente && cedulaExistente.length > 0) {
        throw new Error("La identificación ingresada ya se encuentra registrada.");
      }

      // 2. Crear el usuario en auth.users
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

      // 3. Subir el comprobante si existe
      let comprobanteUrl: string | null = null;
      if (careerProofFile) {
        const filePath = `${authData.user.id}/${careerProofFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from('comprobantes-carrera')
          .upload(filePath, careerProofFile);

        if (uploadError) {
          throw new Error("Error al subir el comprobante: " + uploadError.message);
        }

        const { data: urlData } = supabase.storage
          .from('comprobantes-carrera')
          .getPublicUrl(filePath);
        
        comprobanteUrl = urlData.publicUrl;
      }

      // 4. Insertar el perfil completo en la tabla 'perfiles'
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
          comprobante_carrera_url: comprobanteUrl,
          estado_verificacion: comprobanteUrl ? 'pendiente' : 'no_solicitado',
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
          <div className="md:col-span-2">
            <Label htmlFor="idType" value="Tipo de Identificación" />
            <div className="flex gap-2">
              <Select id="idType" name="idType" value={idType} onChange={(e) => {
                setIdType(e.target.value);
                setFormErrors(prev => ({ ...prev, cedula: '' })); // Clear error on type change
              }} className="w-1/3">
                <option value="cedula">Cédula</option>
                <option value="pasaporte">Pasaporte</option>
              </Select>
              <TextInput 
                id="cedula" 
                name="cedula" 
                type="text" 
                maxLength={20} 
                required 
                onChange={handleChange} 
                onBlur={handleIdentificacionBlur}
                value={formData.cedula} 
                className="w-2/3"
                color={formErrors.cedula ? 'failure' : 'gray'}
                helperText={formErrors.cedula && <span className="text-red-600">{formErrors.cedula}</span>}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="telefono" value="Teléfono (10 dígitos)" />
            <TextInput 
              id="telefono" 
              name="telefono" 
              type="tel" 
              inputMode="numeric" 
              pattern="\d*" 
              maxLength={10} 
              required 
              onChange={handleChange} 
              onBlur={handleTelefonoBlur}
              value={formData.telefono}
              color={formErrors.telefono ? 'failure' : 'gray'}
              helperText={formErrors.telefono && <span className="text-red-600">{formErrors.telefono}</span>}
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="fecha_nacimiento" value="Fecha de Nacimiento" />
            <TextInput 
              id="fecha_nacimiento" 
              name="fecha_nacimiento" 
              type="date" 
              required 
              onChange={handleChange} 
              onBlur={handleFechaNacimientoBlur}
              value={formData.fecha_nacimiento}
              color={formErrors.fecha_nacimiento ? 'failure' : 'gray'}
              helperText={formErrors.fecha_nacimiento && <span className="text-red-600">{formErrors.fecha_nacimiento}</span>}
            />
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

        {formData.email.toLowerCase().includes('@uta.edu.ec') && (
          <div className="mb-6">
            <Label htmlFor="career-proof" value="Comprobante de Carrera (Opcional)" />
            <FileInput id="career-proof" accept="application/pdf" onChange={handleFileChange} />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Sube un PDF que verifique tu carrera si deseas acceder a eventos restringidos.
            </p>
          </div>
        )}

        <Button 
          color="primary" 
          type="submit" 
          className="w-full" 
          disabled={loading || !!successMessage || !!formErrors.cedula || !!formErrors.telefono || !!formErrors.fecha_nacimiento}
        >
          {loading ? "Registrando..." : "Registrarse"}
        </Button>
      </form>
    </>
  );
};

export default AuthRegister;