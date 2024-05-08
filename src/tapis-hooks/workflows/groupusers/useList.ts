import { useQuery, QueryObserverOptions } from 'react-query';
import { list } from 'tapis-api/workflows/groupusers';
import { Workflows } from '@tapis/tapis-typescript';
import { useTapisConfig } from 'tapis-hooks';
import QueryKeys from './queryKeys';

const useList = (
  params: Workflows.ListGroupUsersRequest,
  options: QueryObserverOptions<Workflows.RespGroupUserList, Error> = {}
) => {
  const { accessToken, basePath } = useTapisConfig();
  const result = useQuery<Workflows.RespGroupUserList, Error>(
    [QueryKeys.list, accessToken],
    // Default to no token. This will generate a 403 when calling the list function
    // which is expected behavior for not having a token
    () => list(params, basePath, accessToken?.access_token || ''),
    {
      ...options,
      enabled: !!accessToken,
    }
  );
  return result;
};

export default useList;
