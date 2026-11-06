import type { TemplateModule } from "@/lib/cms/types";
import { BlogIndex } from "./BlogIndex";
import { BlogPost } from "./BlogPost";
import { Home } from "./Home";

const folio: TemplateModule = {
  key: "folio",
  name: "Folio",
  description: "Warm editorial. Serif headlines, story-led About, blog-forward layout.",
  Home,
  BlogIndex,
  BlogPost,
};

export default folio;
