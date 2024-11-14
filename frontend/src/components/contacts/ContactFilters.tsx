import React from 'react';
import { useForm } from 'react-hook-form';
import { Input } from '../common/Input';
import { Button } from '../common/Button';

interface ContactFiltersProps {
  onFilterChange: (filters: ContactFiltersData) => void;
  isLoading?: boolean;
}

interface ContactFiltersData {
  search: string;
  favoriteOnly: boolean;
}

export const ContactFilters: React.FC<ContactFiltersProps> = ({
  onFilterChange,
  isLoading = false
}) => {
  const { register, reset, watch } = useForm<ContactFiltersData>({
    defaultValues: {
      search: '',
      favoriteOnly: false
    }
  });

  // Osserva i cambiamenti nei filtri
  React.useEffect(() => {
    const subscription = watch((value) => {
      onFilterChange(value as ContactFiltersData);
    });
    return () => subscription.unsubscribe();
  }, [watch, onFilterChange]);

  const onReset = () => {
    reset();
    onFilterChange({ search: '', favoriteOnly: false });
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-4">
      <form className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Campo di ricerca */}
          <div className="flex-1">
            <Input
              {...register('search')}
              type="text"
              placeholder="Cerca contatti..."
              disabled={isLoading}
            />
          </div>

          {/* Filtro preferiti */}
          <div className="flex items-center">
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                {...register('favoriteOnly')}
                className="form-checkbox h-5 w-5 text-blue-600"
                disabled={isLoading}
              />
              <span className="ml-2 text-gray-700">Solo preferiti</span>
            </label>
          </div>

          {/* Pulsante reset */}
          <Button
            type="button"
            onClick={onReset}
            disabled={isLoading}
            variant="outline"
          >
            Reset filtri
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ContactFilters;