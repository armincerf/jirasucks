import React, { ChangeEventHandler, useState, RefObject, useRef } from "react";
import SearchIcon from "./assets/icons/search.svg";
import classnames from "classnames";
import { usePopper } from "react-popper";
import { useClickOutside } from "./hooks/useClickOutside";
import { noop } from "lodash";

interface Props {
  placeholder: string;
  //onChange callback
  onChange?: ChangeEventHandler<HTMLInputElement>;
  value?: string | null;
  className?: string;
}

function SearchBox({
  placeholder = "Search",
  onChange = noop,
  value,
  className,
}: Props) {
  const [alertRef, setAlertRef] = useState<HTMLInputElement | null>(null);
  const [popperRef, setPopperRef] = useState<HTMLDivElement | null>(null);
  const [alertVisible, setAlertVisible] = useState(false);

  const ref = useRef<HTMLDivElement>() as RefObject<HTMLDivElement>;

  const { styles, attributes, update } = usePopper(alertRef, popperRef, {
    placement: "top",
  });

  const handleDropdownClick = () => {
    update && update();
    setFocus(true);
    setAlertVisible(!alertVisible);
  };

  useClickOutside(ref, () => {
    if (alertVisible) {
      setAlertVisible(false);
    }
  });

  const [focus, setFocus] = useState(false);
  return (
    <div className={classnames("relative", className)} ref={ref}>
      <input
        ref={setAlertRef}
        type="search"
        placeholder={placeholder}
        onChange={onChange}
        value={value || ""}
        onFocus={handleDropdownClick}
        onBlur={() => setFocus(false)}
        className="w-full pl-8 pr-6 text-sm font-medium placeholder-white text-white bg-gray-900 border-gray-850 border-transparent rounded h-7 ring-0 focus:outline-none"
      />
      <SearchIcon
        className={classnames("absolute w-3.5 h-3.5 text-white left-2 top-2", {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          "text-gray-300": focus,
        })}
      />
    </div>
  );
}

export default SearchBox;
