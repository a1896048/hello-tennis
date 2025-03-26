import { useRouter } from 'next/router'

export default function HomeButton() {
  const router = useRouter()

  return (
    <button
      onClick={() => router.push('/')}
      className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
    >
      首页
    </button>
  )
}