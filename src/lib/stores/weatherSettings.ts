import { writable } from 'svelte/store';

interface Location {
  name: string;
  state: string;
  country: string;
  lat: number;
  lon: number;
  displayName: string;
}

interface WeatherSettingsState {
  isOpen: boolean;
  widgetId: string | null;
  initialLocation: Location | null;
  initialTemperatureUnit: 'celsius' | 'fahrenheit' | undefined;
  onSave: ((location: Location | null, temperatureUnit?: 'celsius' | 'fahrenheit') => void) | null;
  /** Which widget kind opened the modal — traffic hides the temperature unit */
  variant: 'weather' | 'traffic';
}

function createWeatherSettingsStore() {
  const { subscribe, set, update } = writable<WeatherSettingsState>({
    isOpen: false,
    widgetId: null,
    initialLocation: null,
    initialTemperatureUnit: undefined,
    onSave: null,
    variant: 'weather'
  });

  return {
    subscribe,
    open: (
      widgetId: string,
      initialLocation: Location | null,
      initialTemperatureUnit: 'celsius' | 'fahrenheit' | undefined,
      onSave: (location: Location | null, temperatureUnit?: 'celsius' | 'fahrenheit') => void,
      variant: 'weather' | 'traffic' = 'weather'
    ) => {
      set({
        isOpen: true,
        widgetId,
        initialLocation,
        initialTemperatureUnit,
        onSave,
        variant
      });
    },
    close: () => {
      update(state => ({ ...state, isOpen: false }));
    },
    reset: () => {
      set({
        isOpen: false,
        widgetId: null,
        initialLocation: null,
        initialTemperatureUnit: undefined,
        onSave: null,
        variant: 'weather'
      });
    }
  };
}

export const weatherSettings = createWeatherSettingsStore();
