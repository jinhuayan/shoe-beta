import { Select } from "@/components/ui/controls";
type ShoeFilterProps = {
  name: string;
  label: string;
  value?: string;
  options: Record<string, string>;
};

export function ShoeFilter({ name, label, value, options }: ShoeFilterProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={name} className="block text-sm font-medium">{label}</label>
      <Select
        id={name}
        name={name}
        defaultValue={value ?? ""}
        className="w-full"
      >
        <option value="">Any</option>
        {Object.entries(options).map(([key, text]) => <option key={key} value={key}>{text}</option>)}
      </Select>
    </div>
  );
}
