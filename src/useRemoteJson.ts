import { useEffect, useState } from "react";

export const useRemoteJson = (uri: string, placeholder?: any) => {
  const [data, setData] = useState<any>(placeholder ? placeholder : null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(uri)
      .then(response => response.json())
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(e => {
        setError(e);
        setLoading(false);
      });
  }, [uri]);

  return { data, loading, error };
};
