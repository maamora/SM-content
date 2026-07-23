// Stub for next/image – renders a plain <img> in jsdom component tests.
import React from "react";

interface NextImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    fill?: boolean;
    priority?: boolean;
    quality?: number;
    sizes?: string;
    loading?: "lazy" | "eager";
}

const NextImage = ({ src, alt, width, height, fill: _fill, priority: _priority, ...rest }: NextImageProps) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} width={width} height={height} {...rest} />
);

NextImage.displayName = "NextImage";

export default NextImage;
