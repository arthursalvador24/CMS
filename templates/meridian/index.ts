import type { TemplateModule } from "@/lib/cms/types";
import { BlogIndex } from "./BlogIndex";
import { BlogPost } from "./BlogPost";
import { Home } from "./Home";

const meridian: TemplateModule = {
  key: "meridian",
  name: "Meridian",
  description: "Light, clean corporate. Full-width image carousel hero, crisp sans type, structured sections.",
  Home,
  BlogIndex,
  BlogPost,
};

export default meridian;
