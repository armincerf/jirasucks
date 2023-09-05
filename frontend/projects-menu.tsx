import classnames from "classnames";
import SearchIcon from "./assets/icons/search.svg";
import { useRouter } from "next/router";
import { RefObject, useRef, useState } from "react";
import { usePopper } from "react-popper";
import { useClickOutside } from "./hooks/useClickOutside";
type TRepo = {
  repoName: string;
  repoOwner: string;
};

const ProjectMenu = () => {
  const [projectRef, setProjectRef] = useState<HTMLButtonElement | null>(null);
  const [popperRef, setPopperRef] = useState<HTMLDivElement | null>(null);
  const [project, setProject] = useState<TRepo | null>(null);
  const [projectDropDownVisible, setProjectDropDownVisible] = useState(false);
  const router = useRouter();
  const { owner, name } = router.query;
  const repo = `${owner}/${name}`;

  const { styles, attributes, update } = usePopper(projectRef, popperRef, {
    placement: "bottom-start",
  });

  const ref = useRef<HTMLDivElement>() as RefObject<HTMLDivElement>;

  const handleDropdownClick = () => {
    update && update();
    setProjectDropDownVisible(!projectDropDownVisible);
  };

  useClickOutside(ref, () => {
    if (projectDropDownVisible) {
      setProject(null);
      setProjectDropDownVisible(false);
    }
  });

  const projects = [
    {
      repoOwner: "xtdb",
      repoName: "xtdb",
    },
    { repoOwner: "peej", repoName: "to.uri.st" },
    {
      repoOwner: "facebook",
      repoName: "react",
    },
    {
      repoOwner: "metabase",
      repoName: "metabase",
    },
    {
      repoOwner: "vercel",
      repoName: "next.js",
    },
    {
      repoOwner: "tanstack",
      repoName: "query",
    },
    {
      repoOwner: "juxt",
      repoName: "bidi",
    },
    {
      repoOwner: "juxt",
      repoName: "aero",
    },
  ];
  const [projectText, setProjectText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const validProject = projectText.includes("/");

  return (
    <div ref={ref}>
      <button
        className="px-1 py-0.5 ml-3 border border-gray-600 border-dashed rounded text-white hover:text-gray-50 focus:outline-none"
        ref={setProjectRef}
        onMouseDown={handleDropdownClick}
      >
        {repo}
      </button>
      <div
        ref={setPopperRef}
        style={{
          ...styles.popper,
          display: projectDropDownVisible ? "" : "none",
        }}
        {...attributes.popper}
        className="cursor-default bg-white rounded shadow-modal z-100 w-48"
      >
        <div style={styles.offset} className="p-2 gap-2 flex flex-col">
          {projects.map((project) => (
            <a
              key={`${project.repoOwner}/${project.repoName}`}
              href={`/repo/${project.repoOwner}/${project.repoName}`}
              onClick={() => {
                return setProjectDropDownVisible(false);
              }}
              className="text-gray rounded flex align-middle justify-center  hover:text-gray-50 hover:bg-gray-400 focus:outline-none"
            >
              {`${project.repoOwner}/${project.repoName}`}
            </a>
          ))}
          <div className="flex justify-around">
            <input
              type="search"
              placeholder="Owner / Name"
              onKeyDown={(e) => {
                if (e.key === "Enter" && validProject) {
                  setSubmitting(true);
                  window.location.href = `/repo/${projectText}`;
                }
              }}
              onChange={(e) => setProjectText(e.target.value)}
              value={projectText}
              className="w-4/5 pl-4 text-sm font-medium placeholder-gray-300 text-gray bg-gray-50 border-gray-500 rounded h-7 ring-0 focus:outline-none"
            />
            <a
              href={`/repo/${projectText}`}
              onClick={(e) => {
                if (!validProject) {
                  e.preventDefault();
                }
                setSubmitting(true);
              }}
              className="hover:bg-gray-400 w-7 text-gray rounded hover:text-gray-50 items-center justify-center flex"
            >
              <SearchIcon
                className={classnames("w-3.5 h-3.5 focus:outline-none", {
                  "text-gray-100": !validProject,
                  "animate-spin": submitting,
                })}
              />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectMenu;
