import Layout from "../components/Layout";

export default function Dashboard() {
  return (
    <Layout>

      <h1 className="text-2xl font-bold mb-6">
        Welcome 👋
      </h1>

      {/* Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

        <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
          <h2 className="text-gray-500">Total Tokens</h2>
          <p className="text-2xl font-bold text-blue-600">25</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
          <h2 className="text-gray-500">Pending</h2>
          <p className="text-2xl font-bold text-yellow-500">10</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition">
          <h2 className="text-gray-500">Completed</h2>
          <p className="text-2xl font-bold text-green-600">15</p>
        </div>

      </div>

    </Layout>
  );
}