"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Footer from '../../components/Footer';
import Header from "@/components/Header";
import LoadingComponent from './components/LoadingComponent';
import ErrorComponent from './components/ErrorComponent';
import DashboardHeader from './components/DashboardHeader';
import InstituteInfoCard from './components/InstituteInfoCard';
import MembersTable from './components/MembersTable';
import TestsTable from './components/TestsTable';
import { DashboardData } from './types';

export default function OrganizationDashboard() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      fetchDashboardData();
    }
  }, [status, router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard/organization');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || '데이터를 가져오는데 실패했습니다');
      }
      
      const data = await response.json();
      
      if (!data.isOrganization) {
        router.push('/dashboard/personal');
        return;
      }
      
      setDashboardData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = () => {
    router.push('/payment');
  };

  if (loading) {
    return <LoadingComponent />;
  }

  if (error) {
    return <ErrorComponent error={error} onRetry={fetchDashboardData} />;
  }

  if (!dashboardData) {
    return null;
  }

  const { accountStatus, tests, instituteInfo, members, isOrganizationAdmin } = dashboardData;
  
  const isExpired = accountStatus.expire === 'N';
  const expireDate = tests.length > 0 ? tests[0].expiredate : '만료일 없음';
  const isInstitutePaid = instituteInfo?.tur_is_paid === 'Y';
  const allowNoPayment = instituteInfo?.tur_allow_no_payment === 'Y';

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-teal-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-cyan-400/10 to-emerald-400/10 rounded-full blur-3xl animate-pulse"></div>
      </div>
      
      <Header />
      
      <main className="flex-grow p-4 relative z-10">
        <div className="w-full max-w-7xl mx-auto space-y-6">
          <DashboardHeader 
            instituteName={instituteInfo?.ins_name}
            onPayment={handlePayment}
          />
          
          <InstituteInfoCard 
            instituteInfo={instituteInfo}
            isOrganizationAdmin={isOrganizationAdmin}
            isInstitutePaid={isInstitutePaid}
            allowNoPayment={allowNoPayment}
            isExpired={isExpired}
            expireDate={expireDate}
          />

          {isOrganizationAdmin && <MembersTable members={members} />}

          <TestsTable tests={tests} onPayment={handlePayment} />
        </div>
      </main>
      
      <Footer />
      
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        
        .animate-fade-in-delay-1 {
          animation: fade-in 0.6s ease-out 0.2s both;
        }
        
        .animate-fade-in-delay-2 {
          animation: fade-in 0.6s ease-out 0.4s both;
        }
        
        .animate-fade-in-delay-3 {
          animation: fade-in 0.6s ease-out 0.6s both;
        }
      `}</style>
    </div>
  );
}