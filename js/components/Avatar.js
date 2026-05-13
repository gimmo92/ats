import { defineComponent, computed } from "vue";

export const Avatar = defineComponent({
  name: "Avatar",
  props: {
    name: { type: String, default: "" },
    src: { type: String, default: null },
    size: { type: String, default: "" },
  },
  setup(props) {
    const hasPhoto = computed(() => !!props.src);
    const cls = computed(() => {
      const parts = ["avatar"];
      if (props.size) parts.push(props.size);
      parts.push(hasPhoto.value ? "avatar-photo" : "avatar-placeholder");
      return parts.join(" ");
    });
    const style = computed(() =>
      hasPhoto.value ? { backgroundImage: `url(${props.src})` } : {}
    );
    return { cls, style, hasPhoto };
  },
  template: `
  <div :class="cls" :style="style" :title="name">
    <i v-if="!hasPhoto" class="bi bi-person-fill" aria-hidden="true"></i>
  </div>`,
});
