"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface TestStartModalProps {
  testId: number;
}

export default function TestStartModal({ testId }: TestStartModalProps) {
  const router = useRouter();

  useEffect(() => {
    // 풀스크린 모드 진입 시도
    const enterFullScreen = async () => {
      if (document.documentElement.requestFullscreen) {
        try {
          await document.documentElement.requestFullscreen();
        } catch (err) {
          console.error("풀스크린 진입 실패:", err);
        }
      }
    };

    enterFullScreen();

    // 컴포넌트 언마운트 시 풀스크린 해제
    return () => {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(err => {
          console.error("풀스크린 해제 실패:", err);
        });
      }
    };
  }, []);

  // 검사 시작
  const handleStartTest = () => {
    router.push(`/test/${testId}/start`);
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* 헤더 */}
      <div className="bg-blue-600 text-white p-4 shadow-md">
        <h1 className="text-xl font-bold text-center">검사 시작</h1>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex-grow overflow-y-auto p-6 flex flex-col items-center">
        <div className="w-full max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center mb-6">
            <span className="material-icons text-4xl text-blue-600 mr-4">assignment_turned_in</span>
            <h2 className="text-2xl font-bold text-gray-800">검사유의사항</h2>
          </div>

          <div className="text-gray-700 mb-8 space-y-4">
            <p className="mb-4">
              옥타그노시스검사를 시작하기 전, 검사의 효과를 높이기 위해 아래 내용을 꼼꼼하게 읽어주시면 감사하겠습니다.
            </p>

            <ol className="list-decimal list-inside space-y-2 pl-4">
              <li>검사 진행시 모든 문항에 솔직하게 답변해주세요.</li>
              <li>시간 제한이 있는 문항에는 반드시 시간을 엄수해서 답해 주시기 바랍니다.</li>
              <li>고민이 되거나 어려운 문제가 나올 시 시간을 지체하지 마시고, 생각 속에 떠오르는 대로 선택해주세요.</li>
              <li>검사가 시작되면 중간에 멈추지 마시고, 끝까지 한번에 진행해 주세요.</li>
              <li>검사에 방해가 될 수 있는 휴대전화, 전자기기 등은 무음이나 비행기모드로 하시고 검사를 진행해 주세요.</li>
            </ol>
          </div>

          <div className="flex justify-center mt-6 mb-10">
            <button
              onClick={handleStartTest}
              className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition duration-150 ease-in-out"
            >
              <span>다음</span>
              <span className="material-icons ml-2">forward</span>
            </button>
          </div>
        </div>

        {/* 하단 이미지 영역 */}
        <div className="award w-full max-w-4xl mt-8 p-4 border-t">
          <ul className="flex flex-wrap justify-center gap-8">
            <li className="flex flex-col items-center">
              <div className="thumb w-24 h-24 mb-2 relative">
                <img 
                  src="/assets/img/main/img_award01.png" 
                  alt="특허" 
                  className="w-24 h-24 object-contain"
                />
              </div>
              <p className="text text-center text-sm text-gray-700">특허: 제 10-2469087호</p>
            </li>
            <li className="flex flex-col items-center">
              <div className="thumb w-24 h-24 mb-2 relative">
                <img 
                  src="/assets/img/main/img_award02.png" 
                  alt="올해의 우수브랜드 대상" 
                  className="w-24 h-24 object-contain"
                />
              </div>
              <p className="text text-center text-sm text-gray-700">
                올해의 우수브랜드 대상 <br />
                2년 연속 진로교육부문 1위 <br />
                (중앙일보)
              </p>
            </li>
            <li className="flex flex-col items-center">
              <div className="thumb w-24 h-24 mb-2 relative">
                <img 
                  src="/assets/img/main/img_award03.png" 
                  alt="고객감동 브랜드대상" 
                  className="w-24 h-24 object-contain"
                />
              </div>
              <p className="text text-center text-sm text-gray-700">
                고객감동 브랜드대상 <br />
                진로상담부문 1위 <br />
                (중앙일보)
              </p>
            </li>
            <li className="flex flex-col items-center">
              <div className="thumb w-24 h-24 mb-2 relative">
                <img 
                  src="/assets/img/main/img_award04.png" 
                  alt="신지식경영인 대상" 
                  className="w-24 h-24 object-contain"
                />
              </div>
              <p className="text text-center text-sm text-gray-700">
                신지식경영인 대상 <br />
                (조선일보)
              </p>
            </li>
          </ul>
        </div>
      </div>

      {/* 하단 푸터 */}
      <div className="bg-gray-100 p-4 border-t border-gray-200 text-center text-sm text-gray-600">
        © 2025 한국진로적성센터. All rights reserved.
      </div>
    </div>
  );
} 