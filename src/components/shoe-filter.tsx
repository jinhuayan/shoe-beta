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
      <select
        id={name}
        name={name}
        defaultValue={value ?? ""}
        className="w-full rounded-lg border border-stone-300 bg-white p-2 focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <option value="">Any</option>
        {Object.entries(options).map(([key, text]) => <option key={key} value={key}>{text}</option>)}
      </select>
    </div>
  );
}
