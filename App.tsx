// Composition root: the only place allowed to wire ui/, domain/ and data/ together.
import { HomeScreen } from './src/ui/screens/HomeScreen';

export default function App() {
  return <HomeScreen />;
}
