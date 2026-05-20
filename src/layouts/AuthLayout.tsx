import { Outlet } from 'react-router-dom'

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-md">
        <p className="mb-8 text-center text-3xl font-bold tracking-tight text-indigo-400">
          PANGU
        </p>
        <Outlet />
      </div>
    </div>
  )
}
