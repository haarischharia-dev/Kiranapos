import {
  useFonts,
  Anybody_600SemiBold,
  Anybody_700Bold,
} from '@expo-google-fonts/anybody';
import {
  ArchivoNarrow_700Bold,
} from '@expo-google-fonts/archivo-narrow';
import {
  JetBrainsMono_500Medium,
  JetBrainsMono_700Bold,
} from '@expo-google-fonts/jetbrains-mono';
import {
  WorkSans_400Regular,
  WorkSans_500Medium,
  WorkSans_600SemiBold,
} from '@expo-google-fonts/work-sans';

export function useKiranaFonts() {
  const [loaded, error] = useFonts({
    Anybody_600SemiBold,
    Anybody_700Bold,
    ArchivoNarrow_700Bold,
    JetBrainsMono_500Medium,
    JetBrainsMono_700Bold,
    WorkSans_400Regular,
    WorkSans_500Medium,
    WorkSans_600SemiBold,
  });

  return { loaded, error };
}
