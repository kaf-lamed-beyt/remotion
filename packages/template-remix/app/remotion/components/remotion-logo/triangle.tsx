interface Props {
  size: number;
  opacity: number;
  color?: string;
}

export const Triangle = ({ size, opacity, color = "#0B84F3" }: Props) => {
  return (
    <svg
      width={size}
      height={size}
      style={{
        position: "absolute",
        transform: "rotate(90deg)",
        opacity,
        width: size,
        height: size,
      }}
      viewBox="0 0 400 400"
    >
      <g stroke={color} strokeWidth="100" strokeLinejoin="round">
        <path
          fill={color}
          d="M 102 272 a 196 100 0 0 0 195 5 A 196 240 0 0 0 200 102.259 A 196 240 0 0 0 102 272 z"
        />
      </g>
    </svg>
  );
};
