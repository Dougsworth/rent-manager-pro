import { useState, useEffect, useRef } from "react";
import { Loader2, Mic, MicOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getProperties } from "@/services/properties";
import { addTenant } from "@/services/tenants";
import { addTenantSchema } from "@/schemas";
import type { PropertyWithUnits } from "@/types/app.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const NO_UNIT = "__none__";

interface AddTenantModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

// Parse voice input into form fields
function parseVoiceInput(transcript: string) {
  const result: Record<string, string> = {};

  // Try to extract name (first words before any keyword)
  const nameMatch = transcript.match(/^(?:add\s+(?:tenant\s+)?)?([a-zA-Z]+(?:\s+[a-zA-Z]+)?)/i);
  if (nameMatch) {
    const parts = nameMatch[1].trim().split(/\s+/);
    // Don't use known keywords as names
    const keywords = ['email', 'phone', 'unit', 'lease', 'number', 'at', 'mobile'];
    if (parts[0] && !keywords.includes(parts[0].toLowerCase())) {
      result.firstName = parts[0];
      if (parts[1] && !keywords.includes(parts[1].toLowerCase())) {
        result.lastName = parts[1];
      }
    }
  }

  // Extract email
  const emailMatch = transcript.match(/email\s+([^\s,]+@[^\s,]+)/i) ||
    transcript.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
  if (emailMatch) result.email = emailMatch[1].toLowerCase();

  // Extract phone
  const phoneMatch = transcript.match(/(?:phone|number|mobile|cell)\s+([0-9\s\-()]+)/i) ||
    transcript.match(/(\d{3}[\s-]?\d{3}[\s-]?\d{4})/);
  if (phoneMatch) result.phone = phoneMatch[1].trim();

  return result;
}

export function AddTenantModal({ open, onClose, onSuccess }: AddTenantModalProps) {
  const { user } = useAuth();
  const [properties, setProperties] = useState<PropertyWithUnits[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    unit_id: NO_UNIT,
    leaseStart: "",
    leaseEnd: "",
  });

  // Voice input state
  const [listening, setListening] = useState(false);
  const [voiceSupported] = useState(() =>
    typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
  );
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (open && user) {
      getProperties(user.id).then(setProperties).catch(console.error);
    }
  }, [open, user]);

  // Cleanup voice on unmount/close
  useEffect(() => {
    if (!open && recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
    }
  }, [open]);

  const allUnits = properties.flatMap(p =>
    (p.units ?? []).map(u => ({
      id: u.id,
      label: `${p.name} — ${u.name} (J$${u.rent_amount.toLocaleString()}/mo)`,
    }))
  );

  const startVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      const parsed = parseVoiceInput(transcript);

      setFormData(prev => ({
        ...prev,
        firstName: parsed.firstName || prev.firstName,
        lastName: parsed.lastName || prev.lastName,
        email: parsed.email || prev.email,
        phone: parsed.phone || prev.phone,
      }));
      setListening(false);
    };

    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  const stopVoice = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setListening(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError('');

    const result = addTenantSchema.safeParse(formData);
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setSubmitting(true);
    try {
      await addTenant(user.id, {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        unit_id: formData.unit_id === NO_UNIT ? null : formData.unit_id,
        lease_start: formData.leaseStart || null,
        lease_end: formData.leaseEnd || null,
      });
      setFormData({ firstName: "", lastName: "", email: "", phone: "", unit_id: NO_UNIT, leaseStart: "", leaseEnd: "" });
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Failed to add tenant');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Add Tenant</DialogTitle>
            {voiceSupported && (
              <button
                type="button"
                onClick={listening ? stopVoice : startVoice}
                className={`p-2 rounded-lg transition-colors mr-6 ${
                  listening
                    ? 'bg-red-50 text-red-600 hover:bg-red-100'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                title={listening ? "Stop listening" : "Add by voice — say name, email, phone"}
              >
                {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>
            )}
          </div>
          {listening && (
            <p className="text-xs text-red-600 mt-1 animate-pulse">
              Listening... Say: "John Smith email john@test.com phone 876-555-1234"
            </p>
          )}
        </DialogHeader>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="unit">Unit</Label>
            <Select
              id="unit"
              value={formData.unit_id}
              onValueChange={(val) => setFormData({ ...formData, unit_id: val })}
              placeholder="No unit assigned"
              options={[
                { value: NO_UNIT, label: 'No unit assigned' },
                ...allUnits.map(u => ({ value: u.id, label: u.label })),
              ]}
            />
            {allUnits.length === 0 && (
              <p className="text-xs text-gray-500">
                No properties/units found. Add properties in Settings first.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="leaseStart">Lease Start</Label>
              <Input
                id="leaseStart"
                type="date"
                value={formData.leaseStart}
                onChange={(e) => setFormData({ ...formData, leaseStart: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="leaseEnd">Lease End</Label>
              <Input
                id="leaseEnd"
                type="date"
                value={formData.leaseEnd}
                onChange={(e) => setFormData({ ...formData, leaseEnd: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Tenant
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
