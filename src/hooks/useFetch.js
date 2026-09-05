import axios from "axios";
import { useCallback, useEffect, useRef, useState } from "react";
import api, { getApiErrorMessage } from "../utils/api";

const EMPTY_OPTIONS = {};

function defaultSelect(payload) {
  return payload?.data ?? payload;
}

/**
 * Shared API-fetching boilerplate for authenticated frontend requests.
 *
 * @param {string} url API path, relative to the configured Axios base URL.
 * @param {object} [options]
 * @param {object} [options.config] Axios request config (params, method, data…).
 * @param {boolean} [options.enabled=true] Whether the initial request runs.
 * @param {*} [options.initialData=null] Value exposed before the first success.
 * @param {*} [options.requestKey=url] Change this value to trigger an automatic refetch.
 * @param {(payload: any, response: import('axios').AxiosResponse) => any} [options.select]
 * @returns {{data: *, error: Error|null, isLoading: boolean, loading: boolean, refetch: Function, reset: Function}}
 */
export function useFetch(url, options = EMPTY_OPTIONS) {
  const {
    config = EMPTY_OPTIONS,
    enabled = true,
    initialData = null,
    requestKey = url,
    select = defaultSelect,
  } = options;
  const [data, setData] = useState(initialData);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(Boolean(enabled));
  const requestRef = useRef(0);
  const abortRef = useRef(null);
  const configRef = useRef(config);
  const selectRef = useRef(select);

  useEffect(() => {
    configRef.current = config;
    selectRef.current = select;
  }, [config, select]);

  const execute = useCallback(async (configOverride = EMPTY_OPTIONS) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.request({
        ...configRef.current,
        ...configOverride,
        url,
        signal: controller.signal,
      });
      if (requestRef.current !== requestId) return response;
      setData(selectRef.current(response.data, response));
      return response;
    } catch (requestError) {
      if (axios.isCancel(requestError)) return undefined;
      if (requestRef.current !== requestId) return undefined;
      requestError.friendlyMessage = getApiErrorMessage(requestError);
      setError(requestError);
      throw requestError;
    } finally {
      if (requestRef.current === requestId) setIsLoading(false);
    }
  }, [url]);

  // Fetch completion updates are asynchronous; the effect only starts the request.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    execute().catch(() => undefined);

    return () => {
      requestRef.current += 1;
      abortRef.current?.abort();
    };
  }, [enabled, execute, requestKey]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const reset = useCallback(() => {
    requestRef.current += 1;
    abortRef.current?.abort();
    setData(initialData);
    setError(null);
    setIsLoading(false);
  }, [initialData]);

  return {
    data,
    error,
    errorMessage: error ? getApiErrorMessage(error) : null,
    isLoading: enabled && isLoading,
    loading: enabled && isLoading,
    refetch: execute,
    execute,
    reset,
  };
}

export default useFetch;
