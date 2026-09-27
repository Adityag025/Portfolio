import { toast } from 'sonner';

export async function copy(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied`, { description: text });
  } catch {
    toast.error(`Couldn't copy ${label.toLowerCase()}`, { description: `Select it manually: ${text}` });
  }
}
