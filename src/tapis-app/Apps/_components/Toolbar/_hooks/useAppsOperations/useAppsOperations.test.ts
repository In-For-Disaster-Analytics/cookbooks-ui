import '@testing-library/jest-dom/extend-expect';
import { renderHook } from '@testing-library/react-hooks';
import { MutationFunction } from 'tapis-hooks/utils/useMutations';
import { act } from '@testing-library/react';
import useFileOperations from './useAppsOperations';

jest.mock('tapis-hooks/systems');
jest.mock('tapis-hooks/files');

describe('useFileOperations', () => {
  it('runs a sequence of file operations', async () => {
    type MockType = {
      id: string;
    };
    const mockOperation: MutationFunction<MockType, any> = (item) =>
      new Promise((resolve) => resolve({}));
    const mockOnComplete = jest.fn();

    const hook = renderHook(() =>
      useFileOperations<MockType, any>({
        fn: mockOperation,
        onComplete: mockOnComplete,
      })
    );

    const { run } = hook.result.current;

    await act(async () => {
      run([{ id: 'path1' }, { id: 'path2' }]);
    });
    hook.rerender();
    expect(hook.result.current.state).toEqual({
      path1: { status: 'success', error: undefined },
      path2: { status: 'success', error: undefined },
    });
    expect(mockOnComplete).toHaveBeenCalled();
  });
});
