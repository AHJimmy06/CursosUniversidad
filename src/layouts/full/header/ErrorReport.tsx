import { Dropdown } from "flowbite-react";
import { Icon } from "@iconify/react";
import { Link } from "react-router";


const ErrorReport = () => {
    return (
        <div className="relative group/menu">
            <Dropdown label="" className="rounded-sm w-[150px] notification" dismissOnClick={false} renderTrigger={() => (
                <span
                    className="h-10 w-10 hover:text-primary group-hover/menu:bg-lightprimary group-hover/menu:text-primary hover:bg-lightprimary rounded-full flex justify-center items-center cursor-pointer relative"
                    aria-label="Report an error"
                >
                    <Icon icon="solar:question-circle-linear" height={20} />
                </span>
            )}
            >
                <Dropdown.Item as={Link} to="/report-error" className="px-3 py-2 flex items-center bg-hover group/link w-full gap-3 text-dark hover:bg-gray-100">
                    Reportar un error
                </Dropdown.Item>
            </Dropdown>
        </div>
    );
};

export default ErrorReport;