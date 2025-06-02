import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

interface Ticket {
  id: string;
  ticket_number: number;
  plate_number: string;
  car_model: string;
  status: string;
  assignedWorker?: string | null;
  etaMinutes?: number;
}

export default function GlassTicket({ ticketId, role }: { ticketId: string; role: string }) {
  const [ticket, setTicket] = useState<Ticket | null>(null);

  useEffect(() => {
    loadTicket();
  }, [ticketId]);

  const loadTicket = async () => {
    try {
      const response = await fetch(`/api/tickets/${ticketId}`);
      if (!response.ok) throw new Error('Failed to load ticket');
      const data = await response.json();
      setTicket(data);
    } catch (err) {
      console.error('Error loading ticket:', err);
      toast.error('Failed to load ticket');
    }
  };

  if (!ticket) return null;

  return (
    <div className="glass-ticket">
      <div className="ticket-details">
        <h3>Ticket #{ticket.ticket_number}</h3>
        <p>Plate: {ticket.plate_number}</p>
        <p>Model: {ticket.car_model}</p>
        <p>Status: {ticket.status}</p>
        {ticket.etaMinutes && <p>ETA: {ticket.etaMinutes} minutes</p>}
      </div>
    </div>
  );
}