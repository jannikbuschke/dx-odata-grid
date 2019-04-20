import produce from "immer";
import { useEffect, useState } from "react";
export const useRemoteJson = (
  uri: string,
  placeholder?: any,
  addHeaders?: () => Promise<HeadersInit>
) => {
  const [data, setData] = useState<any>(placeholder ? placeholder : null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [key, setKey] = useState(Math.random());

  const getHeaders = async () => {
    const additionalHeaders = addHeaders ? await addHeaders() : {};
    return produce(additionalHeaders, draft => {
      draft["content-type"] = "application/json";
    });
  };

  useEffect(() => {
    setLoading(true);
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
  }, [uri, key]);

  return { data, loading, error, reload: () => setKey(Math.random()) };
};
