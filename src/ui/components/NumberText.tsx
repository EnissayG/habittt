import { StyleSheet, Text, type TextProps } from 'react-native';

import { splitNumbers } from '../format';
import { fonts, NUMERIC_SCALE } from '../theme/tokens';

interface NumberTextProps extends TextProps {
  children: string;
}

/**
 * A line of text whose numbers are drawn in the numeric font, scaled so
 * that they look as tall as the words around them.
 */
export function NumberText({ children, style, ...props }: NumberTextProps) {
  const fontSize = StyleSheet.flatten(style)?.fontSize ?? 14;
  const number = { fontFamily: fonts.numeric, fontSize: fontSize * NUMERIC_SCALE };
  return (
    <Text style={style} {...props}>
      {splitNumbers(children).map((run, i) =>
        run.number ? (
          <Text key={i} style={number}>
            {run.text}
          </Text>
        ) : (
          run.text
        ),
      )}
    </Text>
  );
}
