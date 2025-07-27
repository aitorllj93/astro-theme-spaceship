import type { Element, Node, Parent } from 'hast'

import { isElement, isTag } from "../../utils/hast";

import type { RewriteFn } from './types';

import img from "./img";
import pre from "./pre";

const rewrites: Record<string, RewriteFn<Element>> = {
  pre,
  img,
};


export default ((node: Node, index: number, parent: Parent) => {
  if (isElement(node)) {
    for (const [tag, rewrite] of Object.entries(rewrites)) {
      if (isTag(tag, node)) {
        rewrite(node, index, parent);
      }
    }
  }
}) satisfies RewriteFn;