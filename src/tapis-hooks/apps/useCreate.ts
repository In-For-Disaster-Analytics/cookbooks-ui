import { useEffect } from 'react';
import { useMutation } from 'react-query';
import { Apps } from '@tapis/tapis-typescript';
import { useTapisConfig } from 'tapis-hooks';
import QueryKeys from './queryKeys';
import create from 'tapis-api/apps/create';

const useCreate = () => {
  const { basePath, accessToken } = useTapisConfig();
  const jwt = accessToken?.access_token || '';

  const {
    mutate,
    mutateAsync,
    isLoading,
    isError,
    isSuccess,
    data,
    error,
    reset,
  } = useMutation<Apps.RespResourceUrl, Error, Apps.ReqPostApp>(
    [QueryKeys, basePath, jwt],
    (request: Apps.ReqPostApp) => {
      // Ensure runtimeOptions is an array or undefined before submitting
      const sanitizedRequest: Apps.ReqPostApp = {
        ...request,
        runtimeOptions: Array.isArray(request.runtimeOptions) ? request.runtimeOptions : undefined
      };
      return create(sanitizedRequest, basePath, jwt);
    }
  );

  useEffect(() => reset(), [reset]);

  return {
    isLoading,
    isError,
    isSuccess,
    data,
    error,
    reset,
    createAsync: (request: Apps.ReqPostApp, options?: any) => {
      return mutateAsync(request, options);
    },
    submit: (request: Apps.ReqPostApp) => {
      return mutate(request);
    },
  };
};

export default useCreate;
