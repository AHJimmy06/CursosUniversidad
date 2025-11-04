import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../../utils/supabaseClient";
import { Card, Table, Badge, Spinner, Alert } from "flowbite-react";

type Resumen = {
  evento_id: number;
  evento_nombre: string;
  estado_evento: string;
  total_inscripciones: number;
  inscripciones_aprobadas: number;
  inscripciones_pendientes: number;
  inscripciones_rechazadas: number;
  monto_confirmado: number;
  monto_pendiente: number;
};

type Detalle = {
  inscripcion_id: number;
  alumno: string;
  estado_inscripcion: string;
  estado_pago: string;
  fecha_inscripcion: string;
  monto_esperado: number;
};

export default function SupervisionEvento() {
  const { id } = useParams<{ id: string }>();
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [detalle, setDetalle] = useState<Detalle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!id) throw new Error("ID de evento no válido.");

        const [{ data: resumenData, error: resumenError }, { data: detalleData, error: detalleError }] =
          await Promise.all([
            supabase.from("vw_resumen_evento").select("*").eq("evento_id", id).single(),
            supabase.from("vw_inscripciones_detalle").select("*").eq("evento_id", id),
          ]);

        if (resumenError) throw resumenError;
        if (detalleError) throw detalleError;

        setResumen(resumenData);
        setDetalle(detalleData ?? []);
      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="xl" />
        <span className="pl-3">Cargando supervisión...</span>
      </div>
    );

  if (error) return <Alert color="failure">{error}</Alert>;

  if (!resumen) return <Alert color="warning">No hay datos para este evento.</Alert>;

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold mb-4">
        Seguimiento y Supervisión — {resumen.evento_nombre}
      </h1>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <h3 className="text-gray-500 text-sm">Total inscripciones</h3>
          <p className="text-3xl font-bold">{resumen.total_inscripciones ?? 0}</p>
        </Card>
        <Card>
          <h3 className="text-gray-500 text-sm">Aprobadas</h3>
          <p className="text-3xl font-bold text-green-600">
            {resumen.inscripciones_aprobadas ?? 0}
          </p>
        </Card>
        <Card>
          <h3 className="text-gray-500 text-sm">Pendientes</h3>
          <p className="text-3xl font-bold text-yellow-500">
            {resumen.inscripciones_pendientes ?? 0}
          </p>
        </Card>
        <Card>
          <h3 className="text-gray-500 text-sm">Rechazadas</h3>
          <p className="text-3xl font-bold text-red-600">
            {resumen.inscripciones_rechazadas ?? 0}
          </p>
        </Card>
        <Card>
          <h3 className="text-gray-500 text-sm">Monto confirmado</h3>
          <p className="text-3xl font-bold text-green-600">
            ${resumen.monto_confirmado?.toFixed(2)}
          </p>
        </Card>
        <Card>
          <h3 className="text-gray-500 text-sm">Monto pendiente/fallido</h3>
          <p className="text-3xl font-bold text-red-600">
            ${resumen.monto_pendiente?.toFixed(2)}
          </p>
        </Card>
      </div>

      {/* Tabla de detalle */}
      <Card>
        <h2 className="text-xl font-semibold mb-4">Inscripciones y pagos</h2>
        <Table>
          <Table.Head>
            <Table.HeadCell>#</Table.HeadCell>
            <Table.HeadCell>Alumno</Table.HeadCell>
            <Table.HeadCell>Fecha inscripción</Table.HeadCell>
            <Table.HeadCell>Estado inscripción</Table.HeadCell>
            <Table.HeadCell>Estado pago</Table.HeadCell>
            <Table.HeadCell>Monto esperado</Table.HeadCell>
          </Table.Head>
          <Table.Body className="divide-y">
            {detalle.map((fila) => (
              <Table.Row key={fila.inscripcion_id}>
                <Table.Cell>{fila.inscripcion_id}</Table.Cell>
                <Table.Cell>{fila.alumno || "—"}</Table.Cell>
                <Table.Cell>
                  {fila.fecha_inscripcion
                    ? new Date(fila.fecha_inscripcion).toLocaleDateString("es-ES")
                    : "—"}
                </Table.Cell>
                <Table.Cell>
                  <Badge
                    color={
                      fila.estado_inscripcion.startsWith("aprob")
                        ? "success"
                        : fila.estado_inscripcion.startsWith("pendiente")
                        ? "warning"
                        : "failure"
                    }
                  >
                    {fila.estado_inscripcion}
                  </Badge>
                </Table.Cell>
                <Table.Cell>
                  <Badge
                    color={
                      fila.estado_pago === "confirmado"
                        ? "success"
                        : fila.estado_pago === "pendiente"
                        ? "warning"
                        : fila.estado_pago === "fallido"
                        ? "failure"
                        : "gray"
                    }
                  >
                    {fila.estado_pago || "—"}
                  </Badge>
                </Table.Cell>
                <Table.Cell>
                  ${fila.monto_esperado?.toFixed(2) ?? "—"}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </Card>
    </div>
  );
}
