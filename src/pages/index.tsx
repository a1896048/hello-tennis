export default function Home() {
    return (
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-4">欢迎来到网球记分系统</h2>
        <div className="grid gap-4">
          <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            创建比赛
          </button>
          <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
            查看战绩
          </button>
        </div>
      </div>
    )
  }