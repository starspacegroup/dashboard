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
}

function createWeatherSettingsStore() {
  const { subscribe, set, update } = writable<WeatherSettingsState>({
    isOpen: false,
    widgetId: null,
    initialLocation: null,
    initialTemperatureUnit: undefined,
    onSave: null
  });

  return {
    subscribe,
    open: (
      widgetId: string,
      initialLocation: Location | null,
      initialTemperatureUnit: 'celsius' | 'fahrenheit' | undefined,
      onSave: (location: Location | null, temperatureUnit?: 'celsius' | 'fahrenheit') => void
    ) => {
      set({
        isOpen: true,
        widgetId,
        initialLocation,
        initialTemperatureUnit,
        onSave
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
        onSave: null
      });
    }
  };
}

export const weatherSettings = createWeatherSettingsStore();
