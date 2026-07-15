import { useState, useEffect } from 'react';

export const useNameEnquiry = (bankCode: string | null | undefined, accountNumber: string | null | undefined) => {
  const [accountName, setAccountName] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchAccountName = async () => {
      if (!bankCode || !accountNumber || accountNumber.length !== 10) {
        setAccountName('');
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);
      setAccountName('');
      
      try {
        const LOCAL_API_BASE_URL = import.meta.env.VITE_LOCAL_API_BASE_URL || "http://localhost:50001/api";
        const PRODUCTION_API_BASE_URL = import.meta.env.VITE_PRODUCTION_API_BASE_URL || "https://api.beams.saference.com/api";
        const API_BASE_URL = (
          import.meta.env.VITE_API_BASE_URL ||
          (import.meta.env.MODE === "production" ? PRODUCTION_API_BASE_URL : LOCAL_API_BASE_URL)
        ).replace(/\/$/, "");

        const token = localStorage.getItem("beams_auth_token");

        const response = await fetch(`${API_BASE_URL}/banks/name-enquiry`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'accept': 'application/json',
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            bankCode,
            accountNumber
          })
        });

        let data;
        try {
          data = await response.json();
          console.log("Name Enquiry API Response:", data);
        } catch (e) {
          console.error("Failed to parse response JSON", e);
        }

        if (!response.ok) {
          throw new Error(data?.message || 'Failed to fetch account name');
        }
        
        if (isMounted) {
          if (data.statusCode === 200 && data.data?.accountName) {
            setAccountName(data.data.accountName);
          } else {
            throw new Error(data.message || 'Account not found');
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'An error occurred');
          setAccountName('');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    const timeoutId = setTimeout(() => {
      fetchAccountName();
    }, 500);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [bankCode, accountNumber]);

  return { accountName, isLoading, error, setAccountName };
};
