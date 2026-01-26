import React, { useState, useEffect } from "react";
import styles from "./styles.module.css";

export default function Figure({ src, caption, alt, width, children, forceLightMode = true }) {
  const [isOpen, setIsOpen] = useState(false);

  const isSvgComponent = typeof src === "function";
  const SvgComponent = isSvgComponent ? src : null;
  const imgSrc = typeof src === "string" ? src : src?.default || null;

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      <figure className={styles.figure}>
        <div
          className={styles.imageWrapper}
          onClick={() => setIsOpen(true)}
          style={{ maxWidth: width, colorScheme: forceLightMode ? 'light only' : undefined }}
        >
          {isSvgComponent ? (
            <SvgComponent
              style={{ width: "100%", height: "auto", maxWidth: "100%" }}
            />
          ) : (
            <img
              src={imgSrc}
              alt={alt || caption}
              style={{ width: "100%", maxWidth: "100%" }}
            />
          )}
        </div>
        {(caption || children) && (
          <figcaption
            className={styles.caption}
            dangerouslySetInnerHTML={children ? undefined : { __html: caption }}
          >
            {children}
          </figcaption>
        )}
      </figure>
      {isOpen && (
        <div className={styles.overlay} onClick={() => setIsOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ colorScheme: forceLightMode ? 'light only' : undefined }}>
            {isSvgComponent ? (
              <SvgComponent
                style={{
                  backgroundColor: "white",
                  borderRadius: "4px 4px 0 0",
                  margin: 0,
                  display: "block",
                }}
              />
            ) : (
              <img src={imgSrc} alt={alt || caption} />
            )}
            {(caption || children) && (
              <figcaption
                className={styles.modalCaption}
                dangerouslySetInnerHTML={
                  children ? undefined : { __html: caption }
                }
              >
                {children}
              </figcaption>
            )}
          </div>
        </div>
      )}
    </>
  );
}
