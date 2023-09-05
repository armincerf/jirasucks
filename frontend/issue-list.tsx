import React, {
  CSSProperties,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import IssueRow from "./issue-row";
import AutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeList } from "react-window";
import type { Issue, IssueUpdate, Priority, Status } from "./issue";

interface Props {
  onUpdateIssues: (issueUpdates: IssueUpdate[]) => void;
  onOpenDetail: (issue: Issue) => void;
  onDeleteIssues: (issues: Issue[]) => void;
  issues: Issue[];
  view: string | null;
}

type ListData = {
  issues: Issue[];
  handleChangePriority: (issue: Issue, priority: Priority) => void;
  handleChangeStatus: (issue: Issue, status: Status) => void;
  handleDeleteIssue: (issue: Issue) => void;
  onOpenDetail: (issue: Issue) => void;
};

const itemKey = (index: number, data: ListData) => data.issues[index].id;

const RawRow = ({
  data,
  index,
  style,
}: {
  data: ListData;
  index: number;
  style: CSSProperties;
}) => (
  <div style={style}>
    <IssueRow
      issue={data.issues[index]}
      onChangePriority={data.handleChangePriority}
      onChangeStatus={data.handleChangeStatus}
      onOpenDetail={data.onOpenDetail}
      onDeleteIssue={data.handleDeleteIssue}
    />
  </div>
);

const Row = memo(RawRow);

const IssueList = ({
  onUpdateIssues,
  onOpenDetail,
  onDeleteIssues,
  issues,
  view,
}: Props) => {
  const fixedSizeListRef = useRef<FixedSizeList>(null);
  useEffect(() => {
    fixedSizeListRef.current?.scrollTo(0);
  }, [view]);

  const handleChangePriority = useCallback(
    (issue: Issue, priority: Priority) => {
      onUpdateIssues([
        {
          issue,
          issueChanges: { priority },
        },
      ]);
    },
    [onUpdateIssues]
  );

  const handleChangeStatus = useCallback(
    (issue: Issue, status: Status) => {
      onUpdateIssues([
        {
          issue,
          issueChanges: { status },
        },
      ]);
    },
    [onUpdateIssues]
  );

  const handleDeleteIssue = useCallback(
    (issue: Issue) => {
      onDeleteIssues([issue]);
    },
    [onDeleteIssues]
  );

  const itemData = useMemo(
    () => ({
      issues,
      handleChangePriority,
      handleChangeStatus,
      handleDeleteIssue,
      onOpenDetail,
    }),
    [
      issues,
      handleChangePriority,
      handleChangeStatus,
      handleDeleteIssue,
      onOpenDetail,
    ]
  );

  return (
    <div className="flex flex-col flex-grow overflow-auto">
      <AutoSizer>
        {({ height, width }) => (
          <FixedSizeList
            ref={fixedSizeListRef}
            height={height}
            itemCount={issues.length}
            itemSize={43}
            itemData={itemData}
            itemKey={itemKey}
            overscanCount={10}
            width={width}
          >
            {Row}
          </FixedSizeList>
        )}
      </AutoSizer>
    </div>
  );
};

export default memo(IssueList);
