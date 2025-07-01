import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, Award, ChevronRight, ClipboardCheck, Loader2 } from "lucide-react"
import Image from "next/image"
import { Card, CardContent, CardHeader } from "../ui/card"

interface TestStartModalProps {
  testId: number
}

export default function TestStartModal({ testId }: TestStartModalProps) {
  const router = useRouter()
  const [isStarting, setIsStarting] = useState(false)

  useEffect(() => {
    // Try to enter fullscreen mode
    const enterFullScreen = async () => {
      if (document.documentElement.requestFullscreen) {
        try {
          await document.documentElement.requestFullscreen()
        } catch (err) {
          console.error("Failed to enter fullscreen:", err)
        }
      }
    }

    enterFullScreen()

    // Exit fullscreen when component unmounts
    return () => {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch((err) => {
          console.error("Failed to exit fullscreen:", err)
        })
      }
    }
  }, [])

  // Start the test
  const handleStartTest = async () => {
    try {
      setIsStarting(true);
      
      // 먼저 mwd_answer_progress 테이블에 데이터 insert를 위해 start API 호출
      console.log('[TestStartModal] 테스트 시작 API 호출 시작');
      
      const response = await fetch(`/api/test/${testId}/start`, {
        method: 'GET',
        headers: {
          'Accept-Language': 'ko-KR',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[TestStartModal] API 호출 실패:', errorData);
        throw new Error(errorData.error || '테스트 시작에 실패했습니다');
      }

      const data = await response.json();
      console.log('[TestStartModal] 테스트 시작 API 응답:', {
        anp_seq: data.anp_seq,
        step: data.step,
        qu_code: data.qu_code
      });

      // 성공적으로 mwd_answer_progress에 데이터가 insert되었으면 테스트 페이지로 이동
      router.push(`/test/${testId}/start`);
    } catch (error) {
      console.error('[TestStartModal] 테스트 시작 오류:', error);
      // 오류가 발생해도 테스트 페이지로 이동 (fallback)
      router.push(`/test/${testId}/start`);
    } finally {
      setIsStarting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-white to-blue-50 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-blue-600 text-white py-4 px-6 shadow-lg">
        <h1 className="text-xl font-bold text-center">검사 시작</h1>
      </div>

      {/* Main content */}
      <div className="flex-grow overflow-y-auto p-4 md:p-8 flex flex-col items-center">
        <Card className="w-full max-w-3xl mx-auto bg-white rounded-xl shadow-xl border-0 overflow-hidden">
          <CardHeader className="bg-blue-50 border-b border-blue-100 py-6">
            <div className="flex justify-center items-center">
              <Image 
                src="/assets/img/ogs.png"
                alt="검사유의사항"
                width={180}
                height={30}
                priority
              />
            </div>
          </CardHeader>
          <CardContent className="p-6 md:p-8">
            <div className="text-gray-700 space-y-6">
              <p className="text-lg text-center">
                국내최초로 적성검사에서 기술특허를 받은 <br />
                ‘옥타그노시스 검사’를 시작하시는 여러분을 환영합니다. <br /><br />
                교육과학적인 문항이 AI와 결합하여 구성된 ‘옥타그노시스 검사’를 <br />
                시작하시기 전 아래의 유의사항을 꼼꼼하게 읽어주시기 바랍니다.
              </p>

              <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
                  <p className="text-amber-800 font-medium">
                    검사가 시작되면 중간에 멈추지 마시고, 끝까지 한번에 진행해 주세요.
                  </p>
                </div>
              </div>

              <ol className="list-decimal list-outside space-y-3 pl-6">
                <li className="text-gray-800">
                  당신에 대한 정확한 검사결과 도출을 위해 모든 문항에 솔직하게 답변해주시기 바랍니다.
                </li>
                <li className="text-gray-800">
                  시간 제한이 있는 문항은 제한 시간을 엄수하여 답하실 수 있도록 합니다.
                </li>
                <li className="text-gray-800">
                  너무 오래 생각하지 말고, 가장 먼저 떠오르는 생각으로 답변하시기 바랍니다.
                </li>
                <li className="text-gray-800">
                  검사가 시작되면, 중간에 멈추지 마시고 끝까지 한번에 진행해주세요. (부득이 중도에 멈추게 될 경우, 로그아웃 하신 후 나중에 다시 진행하실 때, 재로그인하시어 중단되었던 부분부터 재진행하시기 바랍니다.)
                </li>
                <li className="text-gray-800">
                  검사에 방해가 되지 않도록 휴대전화, 전자기기 등은 무음이나 비행기모드로 하시고 진행해주세요.
                </li>
              </ol>
            </div>

            <div className="flex justify-center mt-8">
              <button 
                onClick={handleStartTest}
                disabled={isStarting}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-lg text-lg transition-all duration-300 ease-in-out flex items-center justify-center transform hover:scale-105 hover:shadow-lg disabled:transform-none disabled:shadow-none"
              >
                {isStarting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    <span>시작 중...</span>
                  </>
                ) : (
                  <>
                    <span>다음</span>
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Awards section */}
        {/* <div className="w-full max-w-4xl mt-10 p-6 bg-white rounded-xl shadow-md">
          <h3 className="text-center text-lg font-semibold text-gray-700 mb-6 flex items-center justify-center">
            <Award className="h-5 w-5 mr-2 text-blue-600" />
            인증 및 수상
          </h3>
          <ul className="flex flex-wrap justify-center gap-6 md:gap-10">
            <li className="flex flex-col items-center transition-transform duration-300 hover:transform hover:scale-105">
              <div className="bg-gray-50 rounded-full p-3 mb-3 w-24 h-24 flex items-center justify-center shadow-sm">
                <div className="relative w-20 h-20">
                  <Image
                    src="/assets/img/main/img_award01.png"
                    alt="특허"
                    width={80}
                    height={80}
                    className="object-contain"
                  />
                </div>
              </div>
              <p className="text-center text-sm text-gray-700 font-medium">특허: 제 10-2469087호</p>
            </li>
            <li className="flex flex-col items-center transition-transform duration-300 hover:transform hover:scale-105">
              <div className="bg-gray-50 rounded-full p-3 mb-3 w-24 h-24 flex items-center justify-center shadow-sm">
                <div className="relative w-20 h-20">
                  <Image
                    src="/assets/img/main/img_award02.png"
                    alt="올해의 우수브랜드 대상"
                    width={80}
                    height={80}
                    className="object-contain"
                  />
                </div>
              </div>
              <p className="text-center text-sm text-gray-700 font-medium">
                올해의 우수브랜드 대상 <br />
                2년 연속 진로교육부문 1위 <br />
                (중앙일보)
              </p>
            </li>
            <li className="flex flex-col items-center transition-transform duration-300 hover:transform hover:scale-105">
              <div className="bg-gray-50 rounded-full p-3 mb-3 w-24 h-24 flex items-center justify-center shadow-sm">
                <div className="relative w-20 h-20">
                  <Image
                    src="/assets/img/main/img_award03.png"
                    alt="고객감동 브랜드대상"
                    width={80}
                    height={80}
                    className="object-contain"
                  />
                </div>
              </div>
              <p className="text-center text-sm text-gray-700 font-medium">
                고객감동 브랜드대상 <br />
                진로상담부문 1위 <br />
                (중앙일보)
              </p>
            </li>
            <li className="flex flex-col items-center transition-transform duration-300 hover:transform hover:scale-105">
              <div className="bg-gray-50 rounded-full p-3 mb-3 w-24 h-24 flex items-center justify-center shadow-sm">
                <div className="relative w-20 h-20">
                  <Image
                    src="/assets/img/main/img_award04.png"
                    alt="신지식경영인 대상"
                    width={80}
                    height={80}
                    className="object-contain"
                  />
                </div>
              </div>
              <p className="text-center text-sm text-gray-700 font-medium">
                신지식경영인 대상 <br />
                (조선일보)
              </p>
            </li>
          </ul>
        </div> */}
      </div>

      {/* Footer */}
      <div className="bg-gray-800 text-white py-4 px-6 text-center text-sm">
        <p>© 2025 한국진로적성센터. All rights reserved.</p>
      </div>
    </div>
  )
}