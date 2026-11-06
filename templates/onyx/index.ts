import type { TemplateModule } from "@/lib/cms/types";
import { BlogIndex } from "./BlogIndex";
import { BlogPost } from "./BlogPost";
import { Home } from "./Home";

const onyx: TemplateModule = {
  key: "onyx",
  name: "Onyx",
  description: "Dark and bold. Full-bleed imagery, high contrast, confident motion.",
  Home,
  BlogIndex,
  BlogPost,
};

export default onyx;
