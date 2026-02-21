import { RouterProvider } from './providers/router-provider';
import { QueryProvider } from './providers/query-provider';
import { AppRouter } from './router';

function App() {
  return (
    <QueryProvider>
      <RouterProvider>
        <AppRouter />
      </RouterProvider>
    </QueryProvider>
  );
}

export default App;

