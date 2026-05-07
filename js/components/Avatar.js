import { defineComponent, computed } from "vue";
import { avatarColor, initials } from "../store.js";

export const Avatar = defineComponent({
  name: "Avatar",
  props: {
    name: { type: String, default: "" },
    src: { type: String, default: null },
    size: { type: String, default: "" },
  },
  setup(props) {
    const cls = computed(() => {
      const parts = ["avatar"];
      if (props.size) parts.push(props.size);
      if (!props.src) parts.push(avatarColor(props.name));
      return parts.join(" ");
    });
    const style = computed(() =>
      props.src ? { backgroundImage: `url(${props.src})` } : {}
    );
    const text = computed(() => (props.src ? "" : initials(props.name)));
    return { cls, style, text };
  },
  template: `<div :class="cls" :style="style" :title="name">{{ text }}</div>`,
});
