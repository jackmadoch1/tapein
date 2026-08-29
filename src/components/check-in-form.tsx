import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, X } from "lucide-react";
import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { fileToCompressedDataUrl } from "@/lib/image";
import { checkIn } from "@/lib/tapein";

export function CheckInForm() {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [reading, setReading] = useState(false);

  const submit = useMutation({
    mutationFn: () =>
      checkIn({ data: { note: note.trim(), photoData: photo } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries();
      setNote("");
      setPhoto(null);
      setOpen(false);
      toast.success("Checked in. Needs 2 yeses.");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Could not check in.");
    },
  });

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setReading(true);
    try {
      setPhoto(await fileToCompressedDataUrl(file));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not read photo.");
    } finally {
      setReading(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    submit.mutate();
  }

  if (!open) {
    return (
      <Button className="w-full" onClick={() => setOpen(true)}>
        I went in
      </Button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 border border-border p-3">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => void onFile(e)}
      />

      {photo ? (
        <div className="relative">
          <img
            src={photo}
            alt="Check-in photo"
            className="aspect-[4/3] w-full object-cover"
          />
          <button
            type="button"
            className="absolute right-2 top-2 grid size-10 place-items-center bg-background text-foreground"
            onClick={() => setPhoto(null)}
            aria-label="Remove photo"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={reading}
          onClick={() => fileRef.current?.click()}
        >
          <ImagePlus className="size-4" />
          {reading ? "Reading photo…" : "Add a photo"}
        </Button>
      )}

      <Textarea
        value={note}
        maxLength={280}
        placeholder="Add a message"
        onChange={(e) => setNote(e.target.value)}
      />

      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setOpen(false);
            setNote("");
            setPhoto(null);
          }}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={submit.isPending || reading}>
          {submit.isPending ? "Checking in…" : "Check in"}
        </Button>
      </div>
    </form>
  );
}
