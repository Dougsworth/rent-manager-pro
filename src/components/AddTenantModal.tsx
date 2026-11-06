import { useState, useEffect, useRef } from "react";
import { Mic, MicOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getProperties } from "@/services/properties";
import { addTenant } from "@/services/tenants";
import { addTenantSchema } from "@/schemas";
import type { PropertyWithUnits } from "@/types/app.types";
import { formatMoney } from "@/lib/money";
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
      label: `${p.name}, ${u.name}, ${formatMoney(u.rent_amount)} a month`,
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
      setError(err.message || 'That tenant was not added. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add tenant</DialogTitle>
          {voiceSupported && (
            <div className="mt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={listening ? "-ml-3 text-late" : "-ml-3"}
                onClick={listening ? stopVoice : startVoice}
                aria-pressed={listening}
              >
                {listening ? <MicOff aria-hidden="true" className="h-4 w-4" /> : <Mic aria-hidden="true" className="h-4 w-4" />}
                {listening ? "Stop listening" : "Fill in by voice"}
              </Button>
              {listening && (
                <p role="status" className="mt-1 text-[13.5px] text-quiet">
                  Listening. Say the name, email and phone, like "John Smith email john@test.com phone 876 555 1234".
                </p>
              )}
            </div>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="firstName">First name</Label>
              <Input
                id="firstName"
                className="mt-1.5"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last name</Label>
              <Input
                id="lastName"
                className="mt-1.5"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email (optional)</Label>
            <Input
              id="email"
              className="mt-1.5"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <p className="mt-1 text-[13.5px] text-quiet">Reminders and receipts go to this address.</p>
          </div>

          <div>
            <Label htmlFor="phone">Phone (optional)</Label>
            <Input
              id="phone"
              className="mt-1.5"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="unit">Unit</Label>
            <Select
              id="unit"
              className="mt-1.5"
              value={formData.unit_id}
              onValueChange={(val) => setFormData({ ...formData, unit_id: val })}
              placeholder="No unit yet"
              options={[
                { value: NO_UNIT, label: 'No unit yet' },
                ...allUnits.map(u => ({ value: u.id, label: u.label })),
              ]}
            />
            {allUnits.length === 0 && (
              <p className="mt-1 text-[13.5px] text-quiet">
                You have no units yet. Add them on the Properties page, or save this tenant without one.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="leaseStart">Lease starts</Label>
              <Input
                id="leaseStart"
                className="mt-1.5"
                type="date"
                value={formData.leaseStart}
                onChange={(e) => setFormData({ ...formData, leaseStart: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="leaseEnd">Lease ends</Label>
              <Input
                id="leaseEnd"
                className="mt-1.5"
                type="date"
                value={formData.leaseEnd}
                onChange={(e) => setFormData({ ...formData, leaseEnd: e.target.value })}
              />
            </div>
          </div>

          {error && <p role="alert" className="text-sm font-medium text-late">{error}</p>}

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={onClose} className="max-sm:h-12">
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="max-sm:h-12">
              {submitting ? "Adding" : "Add tenant"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
