import { Outlet } from 'react-router-dom';
import Header from './Header';

export default function CitoyenLayout() {
  return (
    <div className="mx-auto max-w-lg px-4 pb-16">
      <Header />
      <main>
        <Outlet />
      </main>
    </div>
  );
}
