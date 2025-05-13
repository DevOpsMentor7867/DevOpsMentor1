import React from "react";
import JSXParser from "react-jsx-parser";
import * as CustomComponents from "../UI/Card";
import { Lightbulb } from "lucide-react";

const styles = {
  container: "",
  card: "max-w-4xl mx-auto border-none p-4",
  title: "text-lg lg:text-xl text-emerald-400 font-semibold",
  link: "text-emerald-400 hover:text-emerald-300 transition-colors",
  content: "space-y-4 lg:space-y-6",
  step: "space-y-2 lg:space-y-3",
  stepTitle: "text-base lg:text-xl mt-5 font-semibold text-emerald-400",
  text: " text-slate-300",
  tip: "flex items-start gap-2 bg-slate-900/50 p-2 lg:p-3 rounded-md text-slate-400 text-sm lg:text-base",
  tipIcon: "h-4 w-4 lg:h-5 lg:w-5 mt-1 text-amber-400",
  code: "text-sm lg:text-sm text-emerald-300",
  pre:  " bg-slate-900 p-2 lg:p-3 rounded-md font-mono text-sm lg:text-xsm text-emerald-300 overflow-auto custom-scrollbar",
};

const RenderQuestion = ({ questionString }) => {
  return (
    <div className={styles.container}>
      <JSXParser
        bindings={{ styles }}
        jsx={questionString}
        components={{ ...CustomComponents, Lightbulb }}
        renderInWrapper={false}
        showWarnings={true}
      />
    </div>
  );
};

export default RenderQuestion;
