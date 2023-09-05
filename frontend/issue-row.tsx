import React from "react";
import { COMMENT_KEY_PREFIX, Issue, Priority, Status } from "./issue";
import DeleteIcon from "./assets/icons/delete.svg";
import { formatDate } from "../util/date";
import PriorityMenu from "./priority-menu";
import StatusMenu from "./status-menu";
import classNames from "classnames";
import { useSubscribe } from "replicache-react";
import type { Replicache } from "replicache";
import type { M } from "./mutators";
import { useAtomValue } from "jotai";
import { repAtom } from "util/atoms";

interface Props {
  rep: Replicache<M>;
  issue: Issue;
  onChangePriority: (issue: Issue, priority: Priority) => void;
  onChangeStatus: (issue: Issue, status: Status) => void;
  onOpenDetail: (issue: Issue) => void;
  onDeleteIssue: (issue: Issue, isDelete?: boolean) => void;
}

function IssueRow({
  issue,
  onChangePriority,
  onChangeStatus,
  onOpenDetail,
  onDeleteIssue,
}: Props) {
  const handleChangePriority = (p: Priority) => onChangePriority(issue, p);
  const handleChangeStatus = (status: Status) => onChangeStatus(issue, status);
  const handleIssueRowClick = () => onOpenDetail(issue);
  const handleDeleteIssue = () => onDeleteIssue(issue);
  const rep = useAtomValue(repAtom);
  const issueCommentCount = useSubscribe<number>(
    rep,
    async (tx) => {
      const prefix = `${COMMENT_KEY_PREFIX}${issue.id}/`;
      const issueComments = await tx
        .scan({
          prefix,
        })
        .keys()
        .toArray();
      return issueComments.length;
    },
    0,
    []
  );
  return (
    <div className="inline-flex items-center flex-grow flex-shrink w-full min-w-0  pr-2 lg:pr-4">
      <div
        className={classNames(
          "inline-flex items-center flex-grow flex-shrink w-full min-w-0 pl-2 text-sm border-b border-gray-850 hover:bg-gray-850 hover:bg-opacity-40 h-11 cursor-pointer text-white border-y-1"
        )}
        id={issue.id}
        onClick={handleIssueRowClick}
      >
        <div className="flex-shrink-0 ml-2">
          <PriorityMenu
            labelVisible={false}
            onSelect={handleChangePriority}
            priority={issue.priority}
          />
        </div>
        <div className="flex-shrink-0 ml-1">
          <StatusMenu onSelect={handleChangeStatus} status={issue.status} />
        </div>
        <div className="flex-wrap flex-shrink-1 flex-grow ml-2 overflow-hidden font-medium line-clamp-1 overflow-ellipsis ">
          {issue.title.substr(0, 3000) || ""}
        </div>
        <div className="flex-shrink-0 ml-2 font-normal sm:block hidden">
          {`${issueCommentCount} Comments`}
        </div>
        <div className="flex-shrink-0 ml-2 font-normal md:hidden sm:block hidden">
          {issue.creator}
        </div>
        <div className="flex-shrink-0 ml-2 font-normal md:block hidden">
          {`Opened By - ${issue.creator}`}
        </div>
        <div className="flex-shrink-0 ml-2 font-normal sm:block">
          {formatDate(new Date(issue.modified))}
        </div>
      </div>
      <div
        className={classNames(
          "flex-shrink-0 ml-2 font-normal sm:block hover:cursor-pointer"
        )}
      >
        <span className={"px-1"} onMouseDown={handleDeleteIssue}>
          <DeleteIcon />
        </span>
      </div>
    </div>
  );
}

export default React.memo(IssueRow);
