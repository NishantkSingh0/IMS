/** Category dropdown populated from the DB categories list. */
const CategorySelect = ({ categories, value, onChange, required = false, invalid = false }) => (
  <select
    required={required}
    value={value ?? ''}
    onChange={(e) => onChange(e.target.value)}
    className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-primary-500 ${invalid ? 'border-orange-400' : 'border-gray-300'}`}
  >
    <option value="">Select category</option>
    {categories.map((category) => (
      <option key={category.id} value={category.id}>{category.name}</option>
    ))}
  </select>
);

export default CategorySelect;
