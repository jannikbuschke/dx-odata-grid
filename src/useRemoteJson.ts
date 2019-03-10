import produce from "immer";
import { useEffect, useState } from "react";
export const useRemoteJson = (
  uri: string,
  placeholder?: any,
  addHeaders?: () => Promise<HeadersInit>
) => {
  const [data, setData] = useState<any>(placeholder ? placeholder : null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getHeaders = async () => {
    const additionalHeaders = addHeaders ? await addHeaders() : {};
    return produce(additionalHeaders, draft => {
      draft["content-type"] = "application/json";
    });
  };

  useEffect(() => {
    getHeaders()
      .then(headers => fetch(uri, { headers }))
      .then(r => {
        if (r.ok) {
          return r;
        } else {
          console.error("http error", r);
          throw Error(r.statusText);
        }
      })
      .then(response => response.json())
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(e => {
        setError(e.toString());
        setLoading(false);
      });
  }, [uri]);

  return { data, loading, error };
};
