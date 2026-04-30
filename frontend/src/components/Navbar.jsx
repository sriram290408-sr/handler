export default function Navbar({ username, onLogout }) {
  return (
    <header className="mb-6 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
      <span className="text-sm text-gray-500">
        Logged in as: <span className="font-semibold text-gray-900">{username}</span>
      </span>
      <button
        onClick={onLogout}
        className="rounded bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
      >
        Logout
      </button>
    </header>
  );
}
